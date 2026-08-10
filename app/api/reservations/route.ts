import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Un bénéficiaire déclare ses disponibilités sur un ou plusieurs créneaux.
const schema = z.object({
  creneauIds: z
    .array(z.string().min(1))
    .min(1, "Sélectionnez au moins un créneau.")
    .max(60),
  nomClient: z.string().trim().min(2, "Nom trop court").max(120),
  telephone: z.string().trim().min(6, "Téléphone invalide").max(30),
  email: z.string().trim().email().max(180).optional().or(z.literal("")),
  adresse: z.string().trim().max(240).optional().or(z.literal("")),
  besoinsParticuliers: z.string().trim().max(1000).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
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
          nom: d.nomClient,
          telephone: d.telephone,
          email: d.email || null,
          adresse: d.adresse || null,
          besoinsParticuliers: d.besoinsParticuliers || null,
        },
      });

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
        const count = await tx.disponibilite.count({
          where: { creneauId, statut: { in: ["EN_ATTENTE", "CONFIRMEE"] } },
        });
        if (count >= 2) {
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
      return { confirmeDirect, retenus: confirmeDirect ? 1 : enAttente, ignores };
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
      retenus: result.retenus,
      ignores: result.ignores,
    },
    { status: 201 }
  );
}
