import { pedaleurConnecteId } from "@/lib/auth-pedaleur";
import AuthForms from "./auth-forms";
import Dashboard from "./dashboard";
import { donneesTableauDeBord } from "./donnees";

export const dynamic = "force-dynamic";

// Espace pédaleur : connexion / création de compte, puis tableau de bord.
// `/pedaleur?mode=inscription` ouvre directement l'onglet « Créer un compte ».
export default async function PedaleurPage({
  searchParams,
}: {
  searchParams?: { mode?: string };
}) {
  const modeInitial =
    searchParams?.mode === "inscription" ? "inscription" : "connexion";

  const id = pedaleurConnecteId();
  if (!id) return <AuthForms modeInitial={modeInitial} />;

  const donnees = await donneesTableauDeBord(id);
  if (!donnees) return <AuthForms modeInitial={modeInitial} />;

  return <Dashboard {...donnees} />;
}
