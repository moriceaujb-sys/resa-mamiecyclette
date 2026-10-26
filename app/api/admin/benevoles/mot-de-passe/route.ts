import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { estConnecte } from "@/lib/auth";
import { hashMotDePasse } from "@/lib/auth-pedaleur";

// L'équipe donne un mot de passe provisoire à un pédaleur qui a perdu le sien
// (pas d'envoi d'email : l'équipe le lui communique par téléphone).
// Lettres et chiffres faciles à lire et à dicter (sans 0/O, 1/l/I).
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

const schema = z.object({ id: z.string().min(1) });

export async function POST(request: Request) {
  if (!estConnecte()) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }
  const provisoire = Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  const maj = await prisma.pedaleur.updateMany({
    where: { id: parsed.data.id },
    data: { motDePasseHash: hashMotDePasse(provisoire) },
  });
  if (maj.count === 0) {
    return NextResponse.json({ error: "Bénévole introuvable." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, motDePasse: provisoire });
}
