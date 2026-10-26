import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  pedaleurConnecteId,
  verifieMotDePasse,
  hashMotDePasse,
} from "@/lib/auth-pedaleur";

// Le pédaleur connecté change son mot de passe (par exemple après un mot de
// passe provisoire donné par l'équipe).
const schema = z.object({
  actuel: z.string().min(1, "Indiquez votre mot de passe actuel.").max(200),
  nouveau: z.string().min(6, "Le nouveau mot de passe doit faire 6 caractères minimum.").max(200),
});

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
  const pedaleur = await prisma.pedaleur.findUnique({
    where: { id: pedaleurId },
    select: { motDePasseHash: true },
  });
  if (!pedaleur || !verifieMotDePasse(parsed.data.actuel, pedaleur.motDePasseHash)) {
    return NextResponse.json(
      { error: "Le mot de passe actuel n'est pas le bon." },
      { status: 400 }
    );
  }
  await prisma.pedaleur.update({
    where: { id: pedaleurId },
    data: { motDePasseHash: hashMotDePasse(parsed.data.nouveau) },
  });
  return NextResponse.json({ ok: true });
}
