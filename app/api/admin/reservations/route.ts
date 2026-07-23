import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { estConnecte } from "@/lib/auth";
import { envoyerAlerteEquipe } from "@/lib/email";

// Saisie interne d'une réservation par un agent / bénévole.
const creationSchema = z.object({
  creneauId: z.string().min(1),
  nomClient: z.string().trim().min(2).max(120),
  telephone: z.string().trim().min(6).max(30),
  email: z.string().trim().email().max(180).optional().or(z.literal("")),
  adresse: z.string().trim().max(240).optional().or(z.literal("")),
  nombrePersonnes: z.number().int().min(1).max(10),
  besoinsParticuliers: z.string().trim().max(1000).optional().or(z.literal("")),
});

const majSchema = z.object({
  id: z.string().min(1),
  statut: z.enum(["EN_ATTENTE", "CONFIRMEE", "ANNULEE"]),
});

export async function POST(request: Request) {
  if (!estConnecte())
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const parsed = creationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Données invalides." },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const creneau = await prisma.creneau.findUnique({
    where: { id: d.creneauId },
    include: {
      reservations: {
        where: { statut: { not: "ANNULEE" } },
        select: { nombrePersonnes: true },
      },
    },
  });
  if (!creneau) {
    return NextResponse.json({ error: "Créneau introuvable." }, { status: 404 });
  }
  const occupees = creneau.reservations.reduce(
    (t: number, r: { nombrePersonnes: number }) => t + r.nombrePersonnes,
    0
  );
  if (d.nombrePersonnes > creneau.capaciteMax - occupees) {
    return NextResponse.json(
      { error: "Plus assez de places sur ce créneau." },
      { status: 409 }
    );
  }

  const reservation = await prisma.reservation.create({
    data: {
      creneauId: d.creneauId,
      nomClient: d.nomClient,
      telephone: d.telephone,
      email: d.email || null,
      adresse: d.adresse || null,
      nombrePersonnes: d.nombrePersonnes,
      besoinsParticuliers: d.besoinsParticuliers || null,
      source: "INTERNE",
      statut: "CONFIRMEE", // saisie interne = déjà confirmée par l'équipe
    },
  });

  // Alerte équipe facultative (utile si plusieurs personnes gèrent).
  await envoyerAlerteEquipe(reservation, creneau).catch(() => {});

  return NextResponse.json({ ok: true, id: reservation.id }, { status: 201 });
}

// Changer le statut d'une réservation (confirmer / annuler / remettre en attente).
export async function PATCH(request: Request) {
  if (!estConnecte())
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const parsed = majSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }
  await prisma.reservation.update({
    where: { id: parsed.data.id },
    data: { statut: parsed.data.statut },
  });
  return NextResponse.json({ ok: true });
}
