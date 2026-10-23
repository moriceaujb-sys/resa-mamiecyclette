import { prisma } from "@/lib/prisma";
import { ensureCreneaux, creneauxPourPedaleurs, baladesDuPedaleur } from "@/lib/creneaux";
import { profilComplet } from "@/lib/pedaleurs";

// Données du tableau de bord d'un pédaleur connecté (page d'accueil et /pedaleur).
// Enregistre aussi sa visite, pour signaler les balades apparues d'ici la prochaine.
export async function donneesTableauDeBord(id: string) {
  const pedaleur = await prisma.pedaleur.findUnique({
    where: { id },
    select: {
      nom: true,
      telephone: true,
      dateNaissance: true,
      adresse: true,
      derniereVisite: true,
    },
  });
  if (!pedaleur) return null;

  await ensureCreneaux();
  const [aConfirmer, mesBalades] = await Promise.all([
    creneauxPourPedaleurs(pedaleur.derniereVisite),
    baladesDuPedaleur(id),
  ]);
  await prisma.pedaleur.update({ where: { id }, data: { derniereVisite: new Date() } });

  return {
    nom: pedaleur.nom,
    aConfirmer,
    mesBalades,
    profil: {
      complet: profilComplet(pedaleur),
      telephone: pedaleur.telephone ?? "",
      dateNaissance: pedaleur.dateNaissance
        ? pedaleur.dateNaissance.toISOString().slice(0, 10)
        : "",
      adresse: pedaleur.adresse ?? "",
    },
  };
}
