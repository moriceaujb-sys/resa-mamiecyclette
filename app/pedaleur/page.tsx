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

export default async function PedaleurPage() {
  const id = pedaleurConnecteId();
  if (!id) return <AuthForms />;

  const pedaleur = await prisma.pedaleur.findUnique({
    where: { id },
    select: { nom: true },
  });
  if (!pedaleur) return <AuthForms />;

  await ensureCreneaux();
  const [aConfirmer, mesBalades] = await Promise.all([
    creneauxPourPedaleurs(),
    baladesDuPedaleur(id),
  ]);

  return (
    <Dashboard nom={pedaleur.nom} aConfirmer={aConfirmer} mesBalades={mesBalades} />
  );
}
