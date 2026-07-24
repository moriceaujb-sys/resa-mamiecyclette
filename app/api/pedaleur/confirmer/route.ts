import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { pedaleurConnecteId } from "@/lib/auth-pedaleur";

const schema = z.object({ creneauId: z.string().min(1) });

export async function POST(request: Request) {
  const pedaleurId = pedaleurConnecteId();
  if (!pedaleurId) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }
  const creneauId = parsed.data.creneauId;
  const now = new Date();

  const ok = await prisma
    .$transaction(async (tx) => {
      const creneau = await tx.creneau.findUnique({
        where: { id: creneauId },
        include: { disponibilites: { where: { statut: "EN_ATTENTE" } } },
      });
      if (!creneau || !creneau.actif || creneau.pedaleurId || creneau.date < now) {
        throw new Error("INDISPO");
      }
      const enAttente = creneau.disponibilites;
      if (enAttente.length < 2) throw new Error("PAS_ASSEZ");
      const beneficiaireIds = enAttente.map((d) => d.beneficiaireId);

      // Verrouiller le créneau sur ce pédaleur.
      await tx.creneau.update({
        where: { id: creneauId },
        data: { pedaleurId, confirmeLe: now },
      });
      // Confirmer les bénéficiaires de ce créneau.
      await tx.disponibilite.updateMany({
        where: { creneauId, statut: "EN_ATTENTE" },
        data: { statut: "CONFIRMEE" },
      });
      // Libérer leurs autres disponibilités en attente ailleurs.
      await tx.disponibilite.updateMany({
        where: {
          beneficiaireId: { in: beneficiaireIds },
          creneauId: { not: creneauId },
          statut: "EN_ATTENTE",
        },
        data: { statut: "LIBEREE" },
      });
      return true;
    })
    .catch((e: unknown) => {
      if (e instanceof Error && (e.message === "INDISPO" || e.message === "PAS_ASSEZ")) {
        return e.message;
      }
      throw e;
    });

  if (ok === "INDISPO") {
    return NextResponse.json(
      { error: "Ce créneau n'est plus disponible." },
      { status: 409 }
    );
  }
  if (ok === "PAS_ASSEZ") {
    return NextResponse.json(
      { error: "Ce créneau n'a plus 2 bénéficiaires." },
      { status: 409 }
    );
  }
  return NextResponse.json({ ok: true });
}
