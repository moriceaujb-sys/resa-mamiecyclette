import { prisma } from "@/lib/prisma";
import {
  genererSlots,
  DUREE_MINUTES,
  CAPACITE,
  LIEU_DEPART,
  HORIZON_JOURS,
} from "@/lib/horaires";

export type CreneauDisponible = {
  id: string;
  date: string; // ISO
  dureeMinutes: number;
  lieuDepart: string;
  placesRestantes: number;
};

// Crée en base les créneaux récurrents manquants jusqu'à l'horizon.
// Idempotent : n'insère que ce qui n'existe pas déjà. Appelé au chargement des pages.
export async function ensureCreneaux(): Promise<void> {
  const now = new Date();
  const to = new Date(now.getTime() + HORIZON_JOURS * 24 * 3600 * 1000);
  const slots = genererSlots(now, to);
  if (slots.length === 0) return;

  const existants = await prisma.creneau.findMany({
    where: { date: { gte: now, lte: to } },
    select: { date: true },
  });
  const dejaLa = new Set(existants.map((c: { date: Date }) => c.date.getTime()));

  const aCreer = slots
    .filter((s) => !dejaLa.has(s.getTime()))
    .map((s) => ({
      date: s,
      dureeMinutes: DUREE_MINUTES,
      capaciteMax: CAPACITE,
      lieuDepart: LIEU_DEPART,
    }));

  if (aCreer.length > 0) {
    await prisma.creneau.createMany({ data: aCreer, skipDuplicates: true });
  }
}

// Renvoie les créneaux à venir, actifs, avec le nombre de places restantes.
export async function creneauxDisponibles(): Promise<CreneauDisponible[]> {
  const maintenant = new Date();
  const creneaux = await prisma.creneau.findMany({
    where: { actif: true, date: { gte: maintenant } },
    orderBy: { date: "asc" },
    include: {
      reservations: {
        where: { statut: { not: "ANNULEE" } },
        select: { nombrePersonnes: true },
      },
    },
  });

  return creneaux.map((c) => {
    const occupees = c.reservations.reduce(
      (t: number, r: { nombrePersonnes: number }) => t + r.nombrePersonnes,
      0
    );
    return {
      id: c.id,
      date: c.date.toISOString(),
      dureeMinutes: c.dureeMinutes,
      lieuDepart: c.lieuDepart,
      placesRestantes: Math.max(0, c.capaciteMax - occupees),
    };
  });
}
