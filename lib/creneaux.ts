import { prisma } from "@/lib/prisma";

export type CreneauDisponible = {
  id: string;
  date: string; // ISO
  dureeMinutes: number;
  lieuDepart: string;
  placesRestantes: number;
};

// Renvoie les créneaux à venir, actifs, avec le nombre de places restantes.
// Les réservations annulées ne comptent pas dans les places occupées.
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
