import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { estConnecte } from "@/lib/auth";

function refuse() {
  return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
}

// Ajouter un créneau (exceptionnel ou complémentaire).
const creationSchema = z.object({
  date: z.string().min(1),
  dureeMinutes: z.number().int().min(5).max(480).default(60),
  lieuDepart: z.string().trim().min(1).max(160).default("Devant le CCAS"),
});

export async function POST(request: Request) {
  if (!estConnecte()) return refuse();
  const parsed = creationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }
  const date = new Date(parsed.data.date);
  if (isNaN(date.getTime())) {
    return NextResponse.json({ error: "Date invalide." }, { status: 400 });
  }
  const creneau = await prisma.creneau.create({
    data: {
      date,
      dureeMinutes: parsed.data.dureeMinutes,
      lieuDepart: parsed.data.lieuDepart,
    },
  });
  return NextResponse.json({ ok: true, id: creneau.id }, { status: 201 });
}

// Modifier un créneau : activer/désactiver et/ou changer date, durée, lieu.
const majSchema = z.object({
  id: z.string().min(1),
  actif: z.boolean().optional(),
  date: z.string().optional(),
  dureeMinutes: z.number().int().min(5).max(480).optional(),
  lieuDepart: z.string().trim().min(1).max(160).optional(),
});

export async function PATCH(request: Request) {
  if (!estConnecte()) return refuse();
  const parsed = majSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }
  const { id, actif, date, dureeMinutes, lieuDepart } = parsed.data;
  const data: Record<string, unknown> = {};
  if (actif !== undefined) data.actif = actif;
  if (dureeMinutes !== undefined) data.dureeMinutes = dureeMinutes;
  if (lieuDepart !== undefined) data.lieuDepart = lieuDepart;
  if (date !== undefined) {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return NextResponse.json({ error: "Date invalide." }, { status: 400 });
    }
    data.date = d;
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Rien à modifier." }, { status: 400 });
  }
  await prisma.creneau.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}

// Supprimer un créneau (et ses disponibilités). Le repère glissant évite qu'il
// soit régénéré.
const supprSchema = z.object({ id: z.string().min(1) });

export async function DELETE(request: Request) {
  if (!estConnecte()) return refuse();
  const parsed = supprSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }
  await prisma.creneau.delete({ where: { id: parsed.data.id } });
  return NextResponse.json({ ok: true });
}
