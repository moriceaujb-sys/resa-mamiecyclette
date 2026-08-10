// Statuts d'un créneau, calculés à partir du nombre de bénéficiaires et de la
// présence d'un pédaleur. Capacité : 2 bénéficiaires + 1 pédaleur.

export type StatutCreneau =
  | "DISPO"
  | "CHERCHE_MOITIE"
  | "COMPLET_ATTENTE_PEDALEUR"
  | "PEDALEUR_CHERCHE_PASSAGER"
  | "COMPLET_AVEC_PEDALEUR";

export function statutCreneau(nbBeneficiaires: number, aPedaleur: boolean): StatutCreneau {
  if (aPedaleur) {
    return nbBeneficiaires >= 2 ? "COMPLET_AVEC_PEDALEUR" : "PEDALEUR_CHERCHE_PASSAGER";
  }
  if (nbBeneficiaires >= 2) return "COMPLET_ATTENTE_PEDALEUR";
  if (nbBeneficiaires === 1) return "CHERCHE_MOITIE";
  return "DISPO";
}

export const LIBELLE_STATUT: Record<StatutCreneau, string> = {
  DISPO: "Dispo",
  CHERCHE_MOITIE: "Cherche sa moitié",
  COMPLET_ATTENTE_PEDALEUR: "Complet, en attente d'un pédaleur",
  PEDALEUR_CHERCHE_PASSAGER: "Pédaleur trouvé, cherche un passager",
  COMPLET_AVEC_PEDALEUR: "Complet avec pédaleur",
};

// Ratio affiché : x/2 tant qu'il n'y a ni pédaleur ni 2e bénéficiaire, puis x/3.
export function ratioStatut(nbBeneficiaires: number, aPedaleur: boolean): string {
  if (aPedaleur || nbBeneficiaires >= 2) {
    return `${nbBeneficiaires + (aPedaleur ? 1 : 0)}/3`;
  }
  return `${nbBeneficiaires}/2`;
}
