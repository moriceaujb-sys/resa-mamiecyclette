"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  async function deconnexion() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }
  return (
    <button onClick={deconnexion} className="btn-ghost text-sm">
      Se déconnecter
    </button>
  );
}
