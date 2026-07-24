// Statuts d'un créneau, calculés à partir du nombre de bénéficiaires et de la
// présence d'un pédaleur. Capacité : 2 bénéficiaires + 1 pédaleur.

export type StatutCreneau =
  | "DISPO"
  | "CHERCHE_MOITIE"
  | "COMPLET_ATTENTE_PEDALEUR"
  | "COMPLET_AVEC_PEDALEUR";

export function statutCreneau(nbBeneficiaires: number, aPedaleur: boolean): StatutCreneau {
  if (nbBeneficiaires >= 2 && aPedaleur) return "COMPLET_AVEC_PEDALEUR";
  if (nbBeneficiaires >= 2) return "COMPLET_ATTENTE_PEDALEUR";
  if (nbBeneficiaires === 1) return "CHERCHE_MOITIE";
  return "DISPO";
}

export const LIBELLE_STATUT: Record<StatutCreneau, string> = {
  DISPO: "Dispo",
  CHERCHE_MOITIE: "Cherche sa moitié",
  COMPLET_ATTENTE_PEDALEUR: "Complet, en attente d'un pédaleur",
  COMPLET_AVEC_PEDALEUR: "Complet avec pédaleur",
};

// Ratio affiché : x/2 tant qu'il manque des bénéficiaires, puis x/3 avec le pédaleur.
export function ratioStatut(nbBeneficiaires: number, aPedaleur: boolean): string {
  if (nbBeneficiaires >= 2) return `${aPedaleur ? 3 : 2}/3`;
  return `${nbBeneficiaires}/2`;
}
