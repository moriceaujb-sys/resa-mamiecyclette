import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import {
  genererSlots,
  estHeureHiver,
  parisVersUtc,
  DUREE_MINUTES,
  LIEU_DEPART,
  HORIZON_JOURS,
} from "@/lib/horaires";
import { statutCreneau, StatutCreneau } from "@/lib/statut";

// Disponibilités qui "occupent" une place de bénéficiaire.
const ACTIVES = ["EN_ATTENTE", "CONFIRMEE"] as const;

// Places occupées par un bénéficiaire : un couple prend les 2 places du triporteur.
export function places(b: { couple: boolean }): number {
  return b.couple ? 2 : 1;
}
function totalPlaces(dispos: { beneficiaire: { couple: boolean } }[]): number {
  return dispos.reduce((n, d) => n + places(d.beneficiaire), 0);
}

// Délai (heures) avant la balade en deçà duquel un bénéficiaire ne peut plus
// rejoindre un créneau déjà pris par un pédaleur (pas d'ajout de dernière minute).
export const DELAI_REJOINDRE_HEURES = 48;

export function peutRejoindreAvecPedaleur(date: Date, now = new Date()): boolean {
  return date.getTime() - now.getTime() >= DELAI_REJOINDRE_HEURES * 3600 * 1000;
}

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
  if (config.versionDonnees < 1) await miseAJourV1(now);
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

// Mise à jour ponctuelle (une seule fois, au premier passage après déploiement) des
// créneaux déjà générés : nouveau lieu de départ et horaires d'hiver de l'après-midi
// (15h → 14h30, 16h → 15h45). Seuls les créneaux à venir encore vides (aucun
// bénéficiaire, aucun pédaleur) changent d'heure ; les autres restent tels quels.
async function miseAJourV1(now: Date): Promise<void> {
  await prisma.creneau.updateMany({
    where: { date: { gte: now }, lieuDepart: "Devant le CCAS" },
    data: { lieuDepart: LIEU_DEPART },
  });

  const vides = await prisma.creneau.findMany({
    where: {
      date: { gte: now },
      pedaleurId: null,
      disponibilites: { none: { statut: { in: [...ACTIVES] } } },
    },
    select: { id: true, date: true },
  });
  const occupes = new Set(
    (
      await prisma.creneau.findMany({ where: { date: { gte: now } }, select: { date: true } })
    ).map((c) => c.date.getTime())
  );
  const decalage: Record<string, [number, number]> = { "15:00": [14, 30], "16:00": [15, 45] };
  for (const c of vides) {
    if (!estHeureHiver(c.date)) continue;
    const p: Record<string, string> = {};
    for (const part of new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Paris",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(c.date))
      p[part.type] = part.value;
    const cible = decalage[`${p.hour}:${p.minute}`];
    if (!cible) continue;
    const nouvelle = parisVersUtc(Number(p.year), Number(p.month) - 1, Number(p.day), cible[0], cible[1]);
    if (occupes.has(nouvelle.getTime())) continue;
    await prisma.creneau.update({ where: { id: c.id }, data: { date: nouvelle } });
    occupes.add(nouvelle.getTime());
  }

  await prisma.configuration.update({ where: { id: 1 }, data: { versionDonnees: 1 } });
}

// Retire le pédaleur d'un créneau sans rien supprimer : les bénéficiaires repassent
// « en attente » et la balade est de nouveau proposée aux autres pédaleurs.
// (Leurs disponibilités libérées ailleurs ne sont pas rétablies.)
export async function retirerPedaleur(
  tx: Prisma.TransactionClient,
  creneauId: string
): Promise<void> {
  await tx.creneau.update({
    where: { id: creneauId },
    data: { pedaleurId: null, confirmeLe: null },
  });
  await tx.disponibilite.updateMany({
    where: { creneauId, statut: "CONFIRMEE", beneficiaire: { type: "PERSONNE" } },
    data: { statut: "EN_ATTENTE" },
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

// Créneaux réservables par un bénéficiaire : actifs, futurs, moins de 2 bénéficiaires,
// non réservés par une structure. Y compris ceux qui ont déjà un pédaleur et 1 seul
// bénéficiaire (Option A : on se rajoute à la balade prévue), mais seulement si la
// balade est à plus de 48 h. Une structure, elle, ne peut prendre qu'un créneau
// entièrement libre (0 bénéficiaire, pas de pédaleur) : filtrage côté formulaire.
export async function creneauxPourBeneficiaires(): Promise<CreneauBeneficiaire[]> {
  const now = new Date();
  const creneaux = await prisma.creneau.findMany({
    where: { actif: true, date: { gte: now } },
    orderBy: { date: "asc" },
    include: {
      disponibilites: {
        where: { statut: { in: [...ACTIVES] } },
        select: { id: true, beneficiaire: { select: { type: true, couple: true } } },
      },
    },
  });
  return creneaux
    .filter((c) => !c.disponibilites.some((d) => d.beneficiaire.type === "STRUCTURE"))
    .map((c) => {
      const nb = totalPlaces(c.disponibilites);
      return {
        id: c.id,
        date: c.date.toISOString(),
        dureeMinutes: c.dureeMinutes,
        lieuDepart: c.lieuDepart,
        nbBeneficiaires: nb,
        placesRestantes: Math.max(0, 2 - nb),
        aPedaleur: c.pedaleurId != null,
      };
    })
    .filter((c) => c.nbBeneficiaires < 2)
    .filter((c) => !c.aPedaleur || peutRejoindreAvecPedaleur(new Date(c.date), now));
}

// ---------- Côté pédaleur ----------
export type CreneauPedaleur = {
  id: string;
  date: string;
  dureeMinutes: number;
  lieuDepart: string;
  nbBeneficiaires: number;
  nouveau: boolean; // un bénéficiaire s'y est positionné depuis la dernière visite
};

// Créneaux qu'un pédaleur peut prendre : au moins 1 bénéficiaire en attente, sans pédaleur.
// (Un 2e bénéficiaire pourra encore rejoindre la balade jusqu'à 48 h avant.)
// `derniereVisite` : précédente visite du pédaleur, pour marquer les nouveautés.
export async function creneauxPourPedaleurs(
  derniereVisite: Date | null = null
): Promise<CreneauPedaleur[]> {
  const now = new Date();
  const creneaux = await prisma.creneau.findMany({
    where: { actif: true, date: { gte: now }, pedaleurId: null },
    orderBy: { date: "asc" },
    include: {
      disponibilites: {
        where: { statut: "EN_ATTENTE" },
        select: { createdAt: true, beneficiaire: { select: { couple: true } } },
      },
    },
  });
  return creneaux
    .map((c) => ({
      id: c.id,
      date: c.date.toISOString(),
      dureeMinutes: c.dureeMinutes,
      lieuDepart: c.lieuDepart,
      nbBeneficiaires: totalPlaces(c.disponibilites),
      nouveau:
        derniereVisite != null &&
        c.disponibilites.some((d) => d.createdAt > derniereVisite),
    }))
    .filter((c) => c.nbBeneficiaires >= 1);
}

export type BaladePedaleur = {
  id: string;
  date: string;
  lieuDepart: string;
  aVenir: boolean;
  nbPassagers: number;
  beneficiaires: { nom: string; telephone: string; adresse: string | null; couple: boolean }[];
};

// Balades confirmées par un pédaleur (ses engagements).
export async function baladesDuPedaleur(pedaleurId: string): Promise<BaladePedaleur[]> {
  const creneaux = await prisma.creneau.findMany({
    where: { pedaleurId },
    orderBy: { date: "asc" },
    include: {
      disponibilites: {
        where: { statut: "CONFIRMEE" },
        include: {
          beneficiaire: { select: { nom: true, telephone: true, adresse: true, couple: true } },
        },
      },
    },
  });
  const now = new Date();
  return creneaux.map((c) => ({
    id: c.id,
    date: c.date.toISOString(),
    lieuDepart: c.lieuDepart,
    aVenir: c.date > now,
    nbPassagers: totalPlaces(c.disponibilites),
    beneficiaires: c.disponibilites.map((d) => ({
      nom: d.beneficiaire.nom,
      telephone: d.beneficiaire.telephone,
      adresse: d.beneficiaire.adresse,
      couple: d.beneficiaire.couple,
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
  structure: boolean; // réservé entièrement par une structure
  statut: StatutCreneau;
  beneficiaires: {
    id: string;
    type: "PERSONNE" | "STRUCTURE";
    nbBeneficiairesEstime: number | null;
    couple: boolean;
    nom: string;
    telephone: string;
    email: string | null;
    adresse: string | null;
    besoinsParticuliers: string | null;
    statut: string;
  }[];
  pedaleur: { nom: string; email: string; telephone: string | null } | null;
};

export async function creneauxAdmin(): Promise<CreneauAdmin[]> {
  const now = new Date();
  const creneaux = await prisma.creneau.findMany({
    where: { date: { gte: now } },
    orderBy: { date: "asc" },
    take: 500,
    include: {
      pedaleur: { select: { nom: true, email: true, telephone: true } },
      disponibilites: {
        where: { statut: { in: [...ACTIVES] } },
        include: { beneficiaire: true },
      },
    },
  });
  return creneaux.map((c) => {
    const nb = totalPlaces(c.disponibilites);
    const aPedaleur = c.pedaleurId != null;
    const structure = c.disponibilites.some((d) => d.beneficiaire.type === "STRUCTURE");
    return {
      id: c.id,
      date: c.date.toISOString(),
      dureeMinutes: c.dureeMinutes,
      lieuDepart: c.lieuDepart,
      actif: c.actif,
      nbBeneficiaires: nb,
      aPedaleur,
      structure,
      statut: statutCreneau(nb, aPedaleur, structure),
      beneficiaires: c.disponibilites.map((d) => ({
        id: d.beneficiaire.id,
        type: d.beneficiaire.type,
        nbBeneficiairesEstime: d.beneficiaire.nbBeneficiairesEstime,
        couple: d.beneficiaire.couple,
        nom: d.beneficiaire.nom,
        telephone: d.beneficiaire.telephone,
        email: d.beneficiaire.email,
        adresse: d.beneficiaire.adresse,
        besoinsParticuliers: d.beneficiaire.besoinsParticuliers,
        statut: d.statut,
      })),
      pedaleur: c.pedaleur
        ? { nom: c.pedaleur.nom, email: c.pedaleur.email, telephone: c.pedaleur.telephone }
        : null,
    };
  });
}
