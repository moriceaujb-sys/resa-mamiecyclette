import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { peutRejoindreAvecPedaleur, places } from "@/lib/creneaux";
import { cleDoublon } from "@/lib/doublons";

// Un bénéficiaire (personne) déclare ses disponibilités sur un ou plusieurs
// créneaux, ou une structure (EHPAD, association…) réserve fermement un ou
// plusieurs créneaux entiers.
const base = {
  creneauIds: z
    .array(z.string().min(1))
    .min(1, "Sélectionnez au moins un créneau.")
    .max(60),
  telephone: z.string().trim().min(6, "Téléphone invalide").max(30),
  besoinsParticuliers: z.string().trim().max(1000).optional().or(z.literal("")),
};

const schemaPersonne = z.object({
  ...base,
  type: z.literal("PERSONNE"),
  nomClient: z.string().trim().min(2, "Nom trop court").max(120),
  email: z.string().trim().email("Email invalide").max(180).optional().or(z.literal("")),
  // Le départ se fait du domicile de la personne : l'adresse est indispensable.
  adresse: z
    .string({ required_error: "L'adresse du domicile est obligatoire." })
    .trim()
    .min(3, "L'adresse du domicile est obligatoire.")
    .max(240),
  // Un couple occupe à lui seul les 2 places du triporteur.
  couple: z.boolean().optional().default(false),
});

const schemaStructure = z.object({
  ...base,
  type: z.literal("STRUCTURE"),
  nomClient: z.string().trim().min(2, "Nom de la structure trop court").max(120),
  email: z.string().trim().min(1, "L'email est obligatoire.").email("Email invalide").max(180),
  adresse: z.string().trim().min(3, "L'adresse postale est obligatoire.").max(240),
  nbBeneficiairesEstime: z.coerce
    .number({ invalid_type_error: "Indiquez le nombre estimé de bénéficiaires." })
    .int("Nombre entier attendu.")
    .min(1, "Indiquez le nombre estimé de bénéficiaires (au moins 1).")
    .max(500),
});

const schema = z.discriminatedUnion("type", [schemaPersonne, schemaStructure]);

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  // Sans type explicite, on considère une personne (compatibilité).
  if (payload && typeof payload === "object" && !("type" in payload)) {
    (payload as Record<string, unknown>).type = "PERSONNE";
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Données invalides." },
      { status: 400 }
    );
  }
  const d = parsed.data;
  const now = new Date();
  const ids = Array.from(new Set(d.creneauIds));

  const result = await prisma
    .$transaction(async (tx) => {
      // Même nom et même téléphone qu'une fiche existante (et même formule,
      // seul ou en couple) : on réutilise cette fiche au lieu d'en créer une
      // nouvelle, en la complétant avec les informations saisies.
      const couple = d.type === "PERSONNE" ? d.couple : false;
      const cle = cleDoublon({ type: d.type, nom: d.nomClient, telephone: d.telephone });
      const candidats = await tx.beneficiaire.findMany({
        where: { type: d.type, couple },
        orderBy: { createdAt: "desc" },
        select: { id: true, type: true, nom: true, telephone: true },
      });
      const existant = candidats.find((c) => cleDoublon(c) === cle);
      const infos = {
        ...(d.email ? { email: d.email } : {}),
        ...(d.adresse ? { adresse: d.adresse } : {}),
        ...(d.besoinsParticuliers ? { besoinsParticuliers: d.besoinsParticuliers } : {}),
        ...(d.type === "STRUCTURE" ? { nbBeneficiairesEstime: d.nbBeneficiairesEstime } : {}),
      };
      const beneficiaire = existant
        ? await tx.beneficiaire.update({ where: { id: existant.id }, data: infos })
        : await tx.beneficiaire.create({
            data: {
              type: d.type,
              nom: d.nomClient,
              telephone: d.telephone,
              email: d.email || null,
              adresse: d.adresse || null,
              besoinsParticuliers: d.besoinsParticuliers || null,
              nbBeneficiairesEstime: d.type === "STRUCTURE" ? d.nbBeneficiairesEstime : null,
              couple,
            },
          });
      const ficheExistante = existant != null;

      // ----- Structure : réservation ferme de créneaux entièrement libres -----
      if (d.type === "STRUCTURE") {
        let retenus = 0;
        let ignores = 0;
        for (const creneauId of ids) {
          const creneau = await tx.creneau.findUnique({
            where: { id: creneauId },
            select: { actif: true, pedaleurId: true, date: true },
          });
          if (!creneau || !creneau.actif || creneau.pedaleurId || creneau.date < now) {
            ignores++;
            continue;
          }
          const count = await tx.disponibilite.count({
            where: { creneauId, statut: { in: ["EN_ATTENTE", "CONFIRMEE"] } },
          });
          if (count > 0) {
            ignores++;
            continue;
          }
          await tx.disponibilite.create({
            data: { creneauId, beneficiaireId: beneficiaire.id, statut: "CONFIRMEE" },
          });
          retenus++;
        }
        if (retenus === 0) throw new Error("AUCUN");
        return { confirmeDirect: false, structure: true, retenus, ignores, ficheExistante };
      }

      // ----- Personne : disponibilités en attente d'un pédaleur -----
      // (un couple ne peut prendre qu'un créneau encore vide, puisqu'il le complète)
      const besoin = d.couple ? 2 : 1;
      let enAttente = 0;
      let ignores = 0;
      let confirmeDirect = false; // le bénéficiaire a rejoint un créneau déjà pris par un pédaleur

      for (const creneauId of ids) {
        // Si le bénéficiaire a déjà trouvé une balade dans ce lot, on ignore le reste.
        if (confirmeDirect) {
          ignores++;
          continue;
        }
        const creneau = await tx.creneau.findUnique({
          where: { id: creneauId },
          select: { actif: true, pedaleurId: true, date: true },
        });
        if (!creneau || !creneau.actif || creneau.date < now) {
          ignores++;
          continue;
        }
        const dispos = await tx.disponibilite.findMany({
          where: { creneauId, statut: { in: ["EN_ATTENTE", "CONFIRMEE"] } },
          select: { beneficiaireId: true, beneficiaire: { select: { type: true, couple: true } } },
        });
        // Déjà inscrit sur ce créneau (fiche réutilisée).
        if (dispos.some((x) => x.beneficiaireId === beneficiaire.id)) {
          ignores++;
          continue;
        }
        const occupees = dispos.reduce((n, x) => n + places(x.beneficiaire), 0);
        // Pas assez de places, ou créneau déjà pris par une structure.
        if (
          occupees + besoin > 2 ||
          dispos.some((x) => x.beneficiaire.type === "STRUCTURE")
        ) {
          ignores++;
          continue;
        }
        if (creneau.pedaleurId) {
          // Un pédaleur est déjà prêt : on rejoint la balade prévue, sauf à moins de
          // 48 h (pas d'ajout de dernière minute pour le pédaleur).
          if (!peutRejoindreAvecPedaleur(creneau.date, now)) {
            ignores++;
            continue;
          }
          await tx.disponibilite.create({
            data: { creneauId, beneficiaireId: beneficiaire.id, statut: "CONFIRMEE" },
          });
          confirmeDirect = true;
        } else {
          await tx.disponibilite.create({
            data: { creneauId, beneficiaireId: beneficiaire.id },
          });
          enAttente++;
        }
      }

      // Si le bénéficiaire a été confirmé sur un créneau, on libère ses autres
      // disponibilités en attente (il ne fait qu'une balade).
      if (confirmeDirect) {
        await tx.disponibilite.updateMany({
          where: { beneficiaireId: beneficiaire.id, statut: "EN_ATTENTE" },
          data: { statut: "LIBEREE" },
        });
      }

      if (!confirmeDirect && enAttente === 0) throw new Error("AUCUN");
      return {
        confirmeDirect,
        structure: false,
        retenus: confirmeDirect ? 1 : enAttente,
        ignores,
        ficheExistante,
      };
    })
    .catch((e: unknown) => {
      if (e instanceof Error && e.message === "AUCUN") return null;
      throw e;
    });

  if (!result) {
    return NextResponse.json(
      { error: "Ces créneaux ne sont plus disponibles. Réessayez." },
      { status: 409 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      confirmeDirect: result.confirmeDirect,
      structure: result.structure,
      retenus: result.retenus,
      ignores: result.ignores,
      ficheExistante: result.ficheExistante,
    },
    { status: 201 }
  );
}
