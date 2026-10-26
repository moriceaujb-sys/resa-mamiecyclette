"use client";

import { useState } from "react";

// Bouton « Nouveau mot de passe » : affiche un mot de passe provisoire à
// communiquer au bénévole par téléphone.
export default function Reinitialiser({ id, nom }: { id: string; nom: string }) {
  const [occupe, setOccupe] = useState(false);
  const [provisoire, setProvisoire] = useState<string | null>(null);

  async function reinitialiser() {
    if (
      !confirm(
        `Donner un nouveau mot de passe à ${nom} ? Son ancien mot de passe ne fonctionnera plus.`
      )
    )
      return;
    setOccupe(true);
    try {
      const res = await fetch("/api/admin/benevoles/mot-de-passe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) alert(d.error || "Action impossible.");
      else setProvisoire(d.motDePasse);
    } finally {
      setOccupe(false);
    }
  }

  if (provisoire) {
    return (
      <div className="rounded-lg bg-soleil-400/25 px-3 py-2 text-marine-700">
        Mot de passe provisoire :{" "}
        <strong className="font-mono text-base tracking-wider">{provisoire}</strong>
        <div className="text-xs">
          À lui transmettre. Il pourra le changer dans son espace (« Mes informations »).
        </div>
      </div>
    );
  }
  return (
    <button
      onClick={reinitialiser}
      disabled={occupe}
      className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-marine-600 ring-1 ring-inset ring-slate-300 hover:bg-marine-50 disabled:opacity-50"
    >
      Nouveau mot de passe
    </button>
  );
}
