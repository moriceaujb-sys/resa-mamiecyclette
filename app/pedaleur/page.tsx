import { pedaleurConnecteId } from "@/lib/auth-pedaleur";
import { prisma } from "@/lib/prisma";
import {
  ensureCreneaux,
  creneauxPourPedaleurs,
  baladesDuPedaleur,
} from "@/lib/creneaux";
import AuthForms from "./auth-forms";
import Dashboard from "./dashboard";

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

  const pedaleur = await prisma.pedaleur.findUnique({
    where: { id },
    select: { nom: true },
  });
  if (!pedaleur) return <AuthForms modeInitial={modeInitial} />;

  await ensureCreneaux();
  const [aConfirmer, mesBalades] = await Promise.all([
    creneauxPourPedaleurs(),
    baladesDuPedaleur(id),
  ]);

  return (
    <Dashboard nom={pedaleur.nom} aConfirmer={aConfirmer} mesBalades={mesBalades} />
  );
}
