import { redirect } from "next/navigation";

// L'espace pédaleur est désormais la page d'accueil du site.
export default function PedaleurPage() {
  redirect("/");
}
