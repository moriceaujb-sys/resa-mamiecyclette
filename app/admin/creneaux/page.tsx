import { estConnecte } from "@/lib/auth";
import { ensureCreneaux, creneauxAdmin } from "@/lib/creneaux";
import CreneauxManager from "./creneaux-manager";

export const dynamic = "force-dynamic";

export default async function CreneauxPage() {
  if (!estConnecte()) return null;
  await ensureCreneaux();
  const creneaux = await creneauxAdmin();
  return <CreneauxManager creneaux={creneaux} />;
}
