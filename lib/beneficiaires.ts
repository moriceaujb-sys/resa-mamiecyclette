import { prisma } from "@/lib/prisma";

export type BeneficiaireListe = {
  id: string;
  nom: string;
  telephone: string;
  email: string | null;
  adresse: string | null;
  besoinsParticuliers: string | null;
  createdAt: string;
  nbCreneaux: number;
};

export async function beneficiairesListe(): Promise<BeneficiaireListe[]> {
  const bens = await prisma.beneficiaire.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { disponibilites: true } } },
  });
  return bens.map((b) => ({
    id: b.id,
    nom: b.nom,
    telephone: b.telephone,
    email: b.email,
    adresse: b.adresse,
    besoinsParticuliers: b.besoinsParticuliers,
    createdAt: b.createdAt.toISOString(),
    nbCreneaux: b._count.disponibilites,
  }));
}

export type DispoDetail = {
  id: string;
  creneauDate: string;
  dureeMinutes: number;
  lieuDepart: string;
  statut: string;
  aPedaleur: boolean;
  pedaleurNom: string | null;
};

export type BeneficiaireDetail = {
  id: string;
  nom: string;
  telephone: string;
  email: string | null;
  adresse: string | null;
  besoinsParticuliers: string | null;
  createdAt: string;
  disponibilites: DispoDetail[];
};

export async function beneficiaireDetail(
  id: string
): Promise<BeneficiaireDetail | null> {
  const b = await prisma.beneficiaire.findUnique({
    where: { id },
    include: {
      disponibilites: {
        orderBy: { creneau: { date: "asc" } },
        include: { creneau: { include: { pedaleur: { select: { nom: true } } } } },
      },
    },
  });
  if (!b) return null;
  return {
    id: b.id,
    nom: b.nom,
    telephone: b.telephone,
    email: b.email,
    adresse: b.adresse,
    besoinsParticuliers: b.besoinsParticuliers,
    createdAt: b.createdAt.toISOString(),
    disponibilites: b.disponibilites.map((d) => ({
      id: d.id,
      creneauDate: d.creneau.date.toISOString(),
      dureeMinutes: d.creneau.dureeMinutes,
      lieuDepart: d.creneau.lieuDepart,
      statut: d.statut,
      aPedaleur: d.creneau.pedaleurId != null,
      pedaleurNom: d.creneau.pedaleur?.nom ?? null,
    })),
  };
}
