import { prisma } from "@/lib/prisma";
import { parisVersUtc } from "@/lib/horaires";

// Indicateurs du tableau de bord de pilotage (espace équipe).
// Une « balade prise » = un créneau actif qui a un pédaleur bénévole, ou qui est
// réservé entièrement par une structure (qui vient avec son propre pédaleur).

export type Indicateurs = {
  calculeLe: string;
  pedaleurs: {
    inscrits: number;
    actifs: number; // au moins une balade prise
    nouveauxCeMois: number;
  };
  beneficiaires: {
    personnes: number;
    structures: number;
    personnesAvecBalade: number; // au moins une balade confirmée
    personnesEnAttente: number; // au moins une disponibilité en attente sur un créneau à venir
  };
  balades: {
    aVenir: number; // créneaux pris, à venir
    realisees: number; // créneaux pris, passés
    enAttentePedaleur: number; // à venir, ≥ 1 bénéficiaire, sans pédaleur
    libresAVenir: number; // à venir, sans bénéficiaire ni pédaleur
    nonPourvues: number; // passés, avec des bénéficiaires en attente mais jamais de pédaleur
    passagersPromenes: number; // passagers des balades réalisées (structures : nombre estimé)
  };
  parMois: {
    cle: string; // "2026-09"
    libelle: string; // "septembre 2026"
    aVenir: boolean;
    benevoles: number; // balades avec un pédaleur bénévole
    structures: number; // balades réservées par une structure
    passagers: number;
  }[];
};

const TZ = "Europe/Paris";

function cleMois(d: Date): string {
  // "2026-09" en heure de Paris.
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit" })
    .format(d)
    .slice(0, 7);
}

function libelleMois(cle: string): string {
  const [y, m] = cle.split("-").map(Number);
  const s = new Intl.DateTimeFormat("fr-FR", {
    timeZone: TZ,
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(y, m - 1, 15, 12)));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function indicateursPilotage(): Promise<Indicateurs> {
  const now = new Date();
  const moisCourant = cleMois(now);
  const [annee, mois1] = moisCourant.split("-").map(Number);
  const debutMois = parisVersUtc(annee, mois1 - 1, 1, 0, 0);

  const [pedaleurs, beneficiaires, creneaux] = await Promise.all([
    prisma.pedaleur.findMany({
      select: { createdAt: true, _count: { select: { creneaux: true } } },
    }),
    prisma.beneficiaire.findMany({
      select: {
        type: true,
        disponibilites: {
          where: { statut: { in: ["EN_ATTENTE", "CONFIRMEE"] } },
          select: { statut: true, creneau: { select: { date: true, actif: true } } },
        },
      },
    }),
    prisma.creneau.findMany({
      where: { actif: true },
      select: {
        date: true,
        pedaleurId: true,
        disponibilites: {
          where: { statut: { in: ["EN_ATTENTE", "CONFIRMEE"] } },
          select: {
            statut: true,
            beneficiaire: { select: { type: true, nbBeneficiairesEstime: true } },
          },
        },
      },
    }),
  ]);

  // --- Pédaleurs ---
  const ped = {
    inscrits: pedaleurs.length,
    actifs: pedaleurs.filter((p) => p._count.creneaux > 0).length,
    nouveauxCeMois: pedaleurs.filter((p) => p.createdAt >= debutMois).length,
  };

  // --- Bénéficiaires ---
  const personnes = beneficiaires.filter((b) => b.type === "PERSONNE");
  const ben = {
    personnes: personnes.length,
    structures: beneficiaires.length - personnes.length,
    personnesAvecBalade: personnes.filter((b) =>
      b.disponibilites.some((d) => d.statut === "CONFIRMEE")
    ).length,
    personnesEnAttente: personnes.filter((b) =>
      b.disponibilites.some(
        (d) => d.statut === "EN_ATTENTE" && d.creneau.actif && d.creneau.date >= now
      )
    ).length,
  };

  // --- Balades ---
  const bal = {
    aVenir: 0,
    realisees: 0,
    enAttentePedaleur: 0,
    libresAVenir: 0,
    nonPourvues: 0,
    passagersPromenes: 0,
  };
  const mois = new Map<string, Indicateurs["parMois"][number]>();

  for (const c of creneaux) {
    const structure = c.disponibilites.find((d) => d.beneficiaire.type === "STRUCTURE");
    const aPedaleur = c.pedaleurId != null;
    const prise = aPedaleur || structure != null;
    const passe = c.date < now;
    const nbPersonnes = c.disponibilites.filter(
      (d) => d.beneficiaire.type === "PERSONNE"
    ).length;
    // Passagers : les personnes confirmées, ou l'estimation de la structure.
    const passagers = structure
      ? structure.beneficiaire.nbBeneficiairesEstime ?? 0
      : c.disponibilites.filter(
          (d) => d.beneficiaire.type === "PERSONNE" && d.statut === "CONFIRMEE"
        ).length;

    if (prise) {
      if (passe) {
        bal.realisees++;
        bal.passagersPromenes += passagers;
      } else {
        bal.aVenir++;
      }
      const cle = cleMois(c.date);
      const m = mois.get(cle) ?? {
        cle,
        libelle: libelleMois(cle),
        aVenir: cle > moisCourant,
        benevoles: 0,
        structures: 0,
        passagers: 0,
      };
      if (structure) m.structures++;
      else m.benevoles++;
      m.passagers += passagers;
      mois.set(cle, m);
    } else if (passe) {
      if (nbPersonnes > 0) bal.nonPourvues++;
    } else if (nbPersonnes > 0) {
      bal.enAttentePedaleur++;
    } else {
      bal.libresAVenir++;
    }
  }

  return {
    calculeLe: now.toISOString(),
    pedaleurs: ped,
    beneficiaires: ben,
    balades: bal,
    parMois: [...mois.values()].sort((a, b) => a.cle.localeCompare(b.cle)),
  };
}
