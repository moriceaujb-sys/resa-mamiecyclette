import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { estConnecte } from "@/lib/auth";

function refuse() {
  return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
}

// Modifier les informations d'un bénéficiaire.
const majSchema = z.object({
  id: z.string().min(1),
  nom: z.string().trim().min(2).max(120),
  telephone: z.string().trim().min(6).max(30),
  email: z.string().trim().email().max(180).optional().or(z.literal("")),
  adresse: z.string().trim().max(240).optional().or(z.literal("")),
  besoinsParticuliers: z.string().trim().max(1000).optional().or(z.literal("")),
});

export async function PATCH(request: Request) {
  if (!estConnecte()) return refuse();
  const parsed = majSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Données invalides." },
      { status: 400 }
    );
  }
  const d = parsed.data;
  await prisma.beneficiaire.update({
    where: { id: d.id },
    data: {
      nom: d.nom,
      telephone: d.telephone,
      email: d.email || null,
      adresse: d.adresse || null,
      besoinsParticuliers: d.besoinsParticuliers || null,
    },
  });
  return NextResponse.json({ ok: true });
}

// Supprimer un bénéficiaire et ses disponibilités (cascade).
const supprSchema = z.object({ id: z.string().min(1) });

export async function DELETE(request: Request) {
  if (!estConnecte()) return refuse();
  const parsed = supprSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }
  await prisma.beneficiaire.delete({ where: { id: parsed.data.id } });
  return NextResponse.json({ ok: true });
}
