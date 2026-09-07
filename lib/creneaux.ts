import { prisma } from "@/lib/prisma";
import { genererSlots, DUREE_MINUTES, LIEU_DEPART, HORIZON_JOURS } from "@/lib/horaires";
import { statutCreneau, StatutCreneau } from "@/lib/statut";

// Disponibilités qui "occupent" une place de bénéficiaire.
const ACTIVES = ["EN_ATTENTE", "CONFIRMEE"] as const;

// Crée en base les créneaux récurrents manquants jusqu'à l'horizon (idempotent).
export async function ensureCreneaux(): Promise<void> {
  const now = new Date();
  const horizon = new Date(now.getTime() + HORIZON_JOURS * 24 * 3600 * 1000);

  // Repère glissant : on ne génère que les créneaux au-delà de ce qui a déjà été
  // généré, pour ne jamais réécraser une modification ou suppression manuelle.
  const config = await prisma.configuration.upsert({
    where: { id: 1 },
    create: { id: 1 },
    update: {},
  });
  const depuis =
    config.genereJusquau && config.genereJusquau > now ? config.genereJusquau : now;
  if (depuis >= horizon) return;

  const slots = genererSlots(depuis, horizon);
  if (slots.length > 0) {
    const existants = await prisma.creneau.findMany({
      where: { date: { gte: depuis, lte: horizon } },
      select: { date: true },
    });
    const dejaLa = new Set(existants.map((c: { date: Date }) => c.date.getTime()));
    const aCreer = slots
      .filter((s) => !dejaLa.has(s.getTime()))
      .map((s) => ({ date: s, dureeMinutes: DUREE_MINUTES, lieuDepart: LIEU_DEPART }));
    if (aCreer.length > 0) {
      await prisma.creneau.createMany({ data: aCreer, skipDuplicates: true });
    }
  }

  await prisma.configuration.update({
    where: { id: 1 },
    data: { genereJusquau: horizon },
  });
}

// ---------- Côté bénéficiaire ----------
export type CreneauBeneficiaire = {
  id: string;
  date: string;
  dureeMinutes: number;
  lieuDepart: string;
  nbBeneficiaires: number;
  placesRestantes: number;
  aPedaleur: boolean;
};

// Créneaux réservables par un bénéficiaire : actifs, futurs, moins de 2 bénéficiaires.
// (Y compris ceux qui ont déjà un pédaleur mais où il reste une place — Option A.)
export async function creneauxPourBeneficiaires(): Promise<CreneauBeneficiaire[]> {
  const now = new Date();
  const creneaux = await prisma.creneau.findMany({
    where: { actif: true, date: { gte: now } },
    orderBy: { date: "asc" },
    include: {
      disponibilites: { where: { statut: { in: [...ACTIVES] } }, select: { id: true } },
    },
  });
  return creneaux
    .map((c) => ({
      id: c.id,
      date: c.date.toISOString(),
      dureeMinutes: c.dureeMinutes,
      lieuDepart: c.lieuDepart,
      nbBeneficiaires: c.disponibilites.length,
      placesRestantes: Math.max(0, 2 - c.disponibilites.length),
      aPedaleur: c.pedaleurId != null,
    }))
    .filter((c) => c.nbBeneficiaires < 2);
}

// ---------- Côté pédaleur ----------
export type CreneauPedaleur = {
  id: string;
  date: string;
  dureeMinutes: number;
  lieuDepart: string;
  nbBeneficiaires: number;
};

// Créneaux qu'un pédaleur peut prendre : au moins 1 bénéficiaire en attente, sans pédaleur.
export async function creneauxPourPedaleurs(): Promise<CreneauPedaleur[]> {
  const now = new Date();
  const creneaux = await prisma.creneau.findMany({
    where: { actif: true, date: { gte: now }, pedaleurId: null },
    orderBy: { date: "asc" },
    include: {
      disponibilites: { where: { statut: "EN_ATTENTE" }, select: { id: true } },
    },
  });
  return creneaux
    .map((c) => ({
      id: c.id,
      date: c.date.toISOString(),
      dureeMinutes: c.dureeMinutes,
      lieuDepart: c.lieuDepart,
      nbBeneficiaires: c.disponibilites.length,
    }))
    .filter((c) => c.nbBeneficiaires >= 2);
}

export type BaladePedaleur = {
  id: string;
  date: string;
  lieuDepart: string;
  beneficiaires: { nom: string; telephone: string }[];
};

// Balades confirmées par un pédaleur (ses engagements).
export async function baladesDuPedaleur(pedaleurId: string): Promise<BaladePedaleur[]> {
  const creneaux = await prisma.creneau.findMany({
    where: { pedaleurId },
    orderBy: { date: "asc" },
    include: {
      disponibilites: {
        where: { statut: "CONFIRMEE" },
        include: { beneficiaire: { select: { nom: true, telephone: true } } },
      },
    },
  });
  return creneaux.map((c) => ({
    id: c.id,
    date: c.date.toISOString(),
    lieuDepart: c.lieuDepart,
    beneficiaires: c.disponibilites.map((d) => ({
      nom: d.beneficiaire.nom,
      telephone: d.beneficiaire.telephone,
    })),
  }));
}

// ---------- Côté admin ----------
export type CreneauAdmin = {
  id: string;
  date: string;
  dureeMinutes: number;
  lieuDepart: string;
  actif: boolean;
  nbBeneficiaires: number;
  aPedaleur: boolean;
  statut: StatutCreneau;
  beneficiaires: {
    id: string;
    nom: string;
    telephone: string;
    email: string | null;
    adresse: string | null;
    besoinsParticuliers: string | null;
    statut: string;
  }[];
  pedaleur: { nom: string; email: string } | null;
};

export async function creneauxAdmin(): Promise<CreneauAdmin[]> {
  const now = new Date();
  const creneaux = await prisma.creneau.findMany({
    where: { date: { gte: now } },
    orderBy: { date: "asc" },
    take: 500,
    include: {
      pedaleur: { select: { nom: true, email: true } },
      disponibilites: {
        where: { statut: { in: [...ACTIVES] } },
        include: { beneficiaire: true },
      },
    },
  });
  return creneaux.map((c) => {
    const nb = c.disponibilites.length;
    const aPedaleur = c.pedaleurId != null;
    return {
      id: c.id,
      date: c.date.toISOString(),
      dureeMinutes: c.dureeMinutes,
      lieuDepart: c.lieuDepart,
      actif: c.actif,
      nbBeneficiaires: nb,
      aPedaleur,
      statut: statutCreneau(nb, aPedaleur),
      beneficiaires: c.disponibilites.map((d) => ({
        id: d.beneficiaire.id,
        nom: d.beneficiaire.nom,
        telephone: d.beneficiaire.telephone,
        email: d.beneficiaire.email,
        adresse: d.beneficiaire.adresse,
        besoinsParticuliers: d.beneficiaire.besoinsParticuliers,
        statut: d.statut,
      })),
      pedaleur: c.pedaleur ? { nom: c.pedaleur.nom, email: c.pedaleur.email } : null,
    };
  });
}
