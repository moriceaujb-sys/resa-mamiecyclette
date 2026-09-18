import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

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
  adresse: z.string().trim().max(240).optional().or(z.literal("")),
});

const schemaStructure = z.object({
  ...base,
  type: z.literal("STRUCTURE"),
  nomClient: z.string().trim().min(2, "Nom de la structure trop court").max(120),
  email: z.string().trim().min(1, "L'email est obligatoire.").email("Email invalide").max(180),
  adresse: z.string().trim().min(5, "L'adresse postale est obligatoire.").max(240),
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
      const beneficiaire = await tx.beneficiaire.create({
        data: {
          type: d.type,
          nom: d.nomClient,
          telephone: d.telephone,
          email: d.email || null,
          adresse: d.adresse || null,
          besoinsParticuliers: d.besoinsParticuliers || null,
          nbBeneficiairesEstime: d.type === "STRUCTURE" ? d.nbBeneficiairesEstime : null,
        },
      });

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
        return { confirmeDirect: false, structure: true, retenus, ignores };
      }

      // ----- Personne : disponibilités en attente d'un pédaleur -----
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
          select: { beneficiaire: { select: { type: true } } },
        });
        // Créneau complet ou déjà pris par une structure.
        if (dispos.length >= 2 || dispos.some((x) => x.beneficiaire.type === "STRUCTURE")) {
          ignores++;
          continue;
        }
        if (creneau.pedaleurId) {
          // Un pédaleur est déjà prêt sur ce créneau → balade confirmée immédiatement.
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
    },
    { status: 201 }
  );
}
