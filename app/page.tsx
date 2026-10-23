import { pedaleurConnecteId } from "@/lib/auth-pedaleur";
import Dashboard from "./pedaleur/dashboard";
import { donneesTableauDeBord } from "./pedaleur/donnees";
import Accueil from "./accueil";

export const dynamic = "force-dynamic";

// Page d'accueil publique. Un pédaleur déjà connecté retrouve directement son
// tableau de bord ; les autres voient la présentation du service.
export default async function Page() {
  const id = pedaleurConnecteId();
  if (id) {
    const donnees = await donneesTableauDeBord(id);
    if (donnees) return <Dashboard {...donnees} />;
  }
  return <Accueil />;
}
