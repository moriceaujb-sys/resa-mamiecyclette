import { pedaleurConnecteId } from "@/lib/auth-pedaleur";
import { prisma } from "@/lib/prisma";
import {
  ensureCreneaux,
  creneauxPourPedaleurs,
  baladesDuPedaleur,
} from "@/lib/creneaux";
import Dashboard from "./pedaleur/dashboard";
import Accueil from "./accueil";

export const dynamic = "force-dynamic";

// Page d'accueil publique. Un pédaleur déjà connecté retrouve directement son
// tableau de bord ; les autres voient la présentation du service.
export default async function Page() {
  const id = pedaleurConnecteId();
  if (id) {
    const pedaleur = await prisma.pedaleur.findUnique({
      where: { id },
      select: { nom: true },
    });
    if (pedaleur) {
      await ensureCreneaux();
      const [aConfirmer, mesBalades] = await Promise.all([
        creneauxPourPedaleurs(),
        baladesDuPedaleur(id),
      ]);
      return (
        <Dashboard nom={pedaleur.nom} aConfirmer={aConfirmer} mesBalades={mesBalades} />
      );
    }
  }
  return <Accueil />;
}
