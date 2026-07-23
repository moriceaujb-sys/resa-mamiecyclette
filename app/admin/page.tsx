import { estConnecte } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureCreneaux } from "@/lib/creneaux";
import LoginForm from "./login-form";
import Dashboard from "./dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!estConnecte()) {
    return <LoginForm />;
  }

  await ensureCreneaux();

  const maintenant = new Date();

  const [creneaux, reservations] = await Promise.all([
    prisma.creneau.findMany({
      where: { date: { gte: maintenant } },
      orderBy: { date: "asc" },
      include: {
        reservations: {
          where: { statut: { not: "ANNULEE" } },
          select: { nombrePersonnes: true },
        },
      },
    }),
    prisma.reservation.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        creneau: { select: { date: true, lieuDepart: true } },
      },
    }),
  ]);

  const creneauxDto = creneaux.map((c) => {
    const occupees = c.reservations.reduce(
      (t: number, r: { nombrePersonnes: number }) => t + r.nombrePersonnes,
      0
    );
    return {
      id: c.id,
      date: c.date.toISOString(),
      dureeMinutes: c.dureeMinutes,
      capaciteMax: c.capaciteMax,
      lieuDepart: c.lieuDepart,
      actif: c.actif,
      placesRestantes: Math.max(0, c.capaciteMax - occupees),
    };
  });

  const reservationsDto = reservations.map((r) => ({
    id: r.id,
    nomClient: r.nomClient,
    telephone: r.telephone,
    email: r.email,
    adresse: r.adresse,
    nombrePersonnes: r.nombrePersonnes,
    besoinsParticuliers: r.besoinsParticuliers,
    statut: r.statut,
    source: r.source,
    creneauDate: r.creneau.date.toISOString(),
    lieuDepart: r.creneau.lieuDepart,
    createdAt: r.createdAt.toISOString(),
  }));

  return <Dashboard creneaux={creneauxDto} reservations={reservationsDto} />;
}
