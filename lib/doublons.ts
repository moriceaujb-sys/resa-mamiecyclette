// Repérage des fiches d'une même personne : même type, même nom (sans accents,
// majuscules ni espaces en trop) et même numéro (chiffres seuls, +33 ramené à 0).
// Sans dépendance serveur : utilisé côté page (regroupement) et côté API.
export function cleDoublon(b: { type: string; nom: string; telephone: string }): string {
  const nom = b.nom
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  const tel = b.telephone.replace(/\D/g, "").replace(/^33(?=\d{9}$)/, "0");
  return `${b.type}|${nom}|${tel}`;
}
