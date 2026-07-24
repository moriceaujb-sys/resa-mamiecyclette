import { estConnecte } from "@/lib/auth";
import { ensureCreneaux, creneauxAdmin } from "@/lib/creneaux";
import LoginForm from "./login-form";
import Dashboard from "./dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!estConnecte()) {
    return <LoginForm />;
  }
  await ensureCreneaux();
  const creneaux = await creneauxAdmin();
  return <Dashboard creneaux={creneaux} />;
}
