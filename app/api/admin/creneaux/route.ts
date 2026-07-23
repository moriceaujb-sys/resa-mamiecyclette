import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { estConnecte } from "@/lib/auth";

const creationSchema = z.object({
  date: z.string().min(1), // ISO datetime local
  dureeMinutes: z.number().int().min(5).max(480).default(45),
  capaciteMax: z.number().int().min(1).max(10).default(2),
  lieuDepart: z.string().trim().min(1).max(160).default("Devant le CCAS"),
});

const majSchema = z.object({
  id: z.string().min(1),
  actif: z.boolean(),
});

export async function POST(request: Request) {
  if (!estConnecte())
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const parsed = creationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }
  const d = parsed.data;
  const date = new Date(d.date);
  if (isNaN(date.getTime())) {
    return NextResponse.json({ error: "Date invalide." }, { status: 400 });
  }

  const creneau = await prisma.creneau.create({
    data: {
      date,
      dureeMinutes: d.dureeMinutes,
      capaciteMax: d.capaciteMax,
      lieuDepart: d.lieuDepart,
    },
  });
  return NextResponse.json({ ok: true, id: creneau.id }, { status: 201 });
}

// Activer / désactiver un créneau (sans supprimer les réservations existantes).
export async function PATCH(request: Request) {
  if (!estConnecte())
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const parsed = majSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }
  await prisma.creneau.update({
    where: { id: parsed.data.id },
    data: { actif: parsed.data.actif },
  });
  return NextResponse.json({ ok: true });
}
