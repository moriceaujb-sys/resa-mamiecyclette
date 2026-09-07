import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { estConnecte } from "@/lib/auth";

function refuse() {
  return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
}

// Supprimer une disponibilité précise (quel que soit son statut).
const supprSchema = z.object({ id: z.string().min(1) });

export async function DELETE(request: Request) {
  if (!estConnecte()) return refuse();
  const parsed = supprSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }
  await prisma.disponibilite.delete({ where: { id: parsed.data.id } });
  return NextResponse.json({ ok: true });
}

// Nettoyer les créneaux d'un bénéficiaire non confirmés par un pédaleur
// (tout sauf les disponibilités CONFIRMEE).
const nettoyerSchema = z.object({ beneficiaireId: z.string().min(1) });

export async function POST(request: Request) {
  if (!estConnecte()) return refuse();
  const parsed = nettoyerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }
  const res = await prisma.disponibilite.deleteMany({
    where: {
      beneficiaireId: parsed.data.beneficiaireId,
      statut: { not: "CONFIRMEE" },
    },
  });
  return NextResponse.json({ ok: true, supprimes: res.count });
}
