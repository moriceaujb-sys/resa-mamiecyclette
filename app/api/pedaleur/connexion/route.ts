import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifieMotDePasse, creerSessionPedaleur } from "@/lib/auth-pedaleur";

const schema = z.object({
  email: z.string().trim().email().max(180),
  motDePasse: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }
  const pedaleur = await prisma.pedaleur.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (!pedaleur || !verifieMotDePasse(parsed.data.motDePasse, pedaleur.motDePasseHash)) {
    return NextResponse.json(
      { error: "Email ou mot de passe incorrect." },
      { status: 401 }
    );
  }
  creerSessionPedaleur(pedaleur.id);
  return NextResponse.json({ ok: true });
}
