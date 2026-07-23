import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { envoyerConfirmationClient, envoyerAlerteEquipe } from "@/lib/email";

const schema = z.object({
  creneauId: z.string().min(1),
  nomClient: z.string().trim().min(2, "Nom trop court").max(120),
  telephone: z.string().trim().min(6, "Téléphone invalide").max(30),
  email: z.string().trim().email().max(180).optional().or(z.literal("")),
  adresse: z.string().trim().max(240).optional().or(z.literal("")),
  nombrePersonnes: z.number().int().min(1).max(10),
  besoinsParticuliers: z.string().trim().max(1000).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Données invalides." },
      { status: 400 }
    );
  }
  const d = parsed.data;

  // Vérifie la disponibilité réelle du créneau (anti-surréservation).
  const creneau = await prisma.creneau.findUnique({
    where: { id: d.creneauId },
    include: {
      reservations: {
        where: { statut: { not: "ANNULEE" } },
        select: { nombrePersonnes: true },
      },
    },
  });

  if (!creneau || !creneau.actif || creneau.date < new Date()) {
    return NextResponse.json(
      { error: "Ce créneau n'est plus disponible." },
      { status: 409 }
    );
  }

  const occupees = creneau.reservations.reduce(
    (t: number, r: { nombrePersonnes: number }) => t + r.nombrePersonnes,
    0
  );
  const restantes = creneau.capaciteMax - occupees;
  if (d.nombrePersonnes > restantes) {
    return NextResponse.json(
      {
        error:
          restantes <= 0
            ? "Ce créneau est complet."
            : `Il ne reste que ${restantes} place(s) sur ce créneau.`,
      },
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
      source: "PUBLIC",
    },
  });

  // Notifications (n'interrompent pas la réponse en cas d'échec SMTP).
  await Promise.allSettled([
    envoyerConfirmationClient(reservation, creneau),
    envoyerAlerteEquipe(reservation, creneau),
  ]);

  return NextResponse.json({ ok: true, id: reservation.id }, { status: 201 });
}
