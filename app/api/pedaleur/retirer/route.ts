import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { pedaleurConnecteId } from "@/lib/auth-pedaleur";
import { retirerPedaleur } from "@/lib/creneaux";

// Le pédaleur se retire d'une balade à venir : le créneau et ses bénéficiaires
// sont conservés, la balade est de nouveau proposée aux autres pédaleurs.
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

  const ok = await prisma.$transaction(async (tx) => {
    const creneau = await tx.creneau.findUnique({
      where: { id: creneauId },
      select: { pedaleurId: true, date: true },
    });
    if (!creneau || creneau.pedaleurId !== pedaleurId || creneau.date < new Date()) {
      return false;
    }
    await retirerPedaleur(tx, creneauId);
    return true;
  });

  if (!ok) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas vous retirer de cette balade." },
      { status: 409 }
    );
  }
  return NextResponse.json({ ok: true });
}
