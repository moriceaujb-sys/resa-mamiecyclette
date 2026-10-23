import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashMotDePasse, creerSessionPedaleur } from "@/lib/auth-pedaleur";
import { champsAssurance, versDateNaissance } from "@/lib/pedaleurs";

const schema = z.object({
  nom: z.string().trim().min(2, "Nom trop court").max(120),
  email: z.string().trim().email("Email invalide").max(180),
  motDePasse: z.string().min(6, "6 caractères minimum").max(200),
  ...champsAssurance,
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Données invalides." },
      { status: 400 }
    );
  }
  const email = parsed.data.email.toLowerCase();
  const existe = await prisma.pedaleur.findUnique({ where: { email } });
  if (existe) {
    return NextResponse.json(
      { error: "Un compte existe déjà avec cet email." },
      { status: 409 }
    );
  }
  const pedaleur = await prisma.pedaleur.create({
    data: {
      nom: parsed.data.nom,
      email,
      telephone: parsed.data.telephone,
      dateNaissance: versDateNaissance(parsed.data.dateNaissance),
      adresse: parsed.data.adresse,
      motDePasseHash: hashMotDePasse(parsed.data.motDePasse),
    },
  });
  creerSessionPedaleur(pedaleur.id);
  return NextResponse.json({ ok: true });
}
