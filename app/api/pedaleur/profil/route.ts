import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { pedaleurConnecteId } from "@/lib/auth-pedaleur";
import { champsAssurance, versDateNaissance } from "@/lib/pedaleurs";

// Le pédaleur complète ou corrige ses informations (assurance du CCAS).
const schema = z.object(champsAssurance);

export async function PATCH(request: Request) {
  const pedaleurId = pedaleurConnecteId();
  if (!pedaleurId) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Données invalides." },
      { status: 400 }
    );
  }
  await prisma.pedaleur.update({
    where: { id: pedaleurId },
    data: {
      telephone: parsed.data.telephone,
      dateNaissance: versDateNaissance(parsed.data.dateNaissance),
      adresse: parsed.data.adresse,
    },
  });
  return NextResponse.json({ ok: true });
}
