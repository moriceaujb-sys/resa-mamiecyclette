"use client";

import { useState } from "react";

// Changement du mot de passe par le pédaleur connecté (par exemple après un mot
// de passe provisoire donné par l'équipe).
export default function MotDePasse() {
  const [ouvert, setOuvert] = useState(false);
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);

  async function changer(formData: FormData) {
    if (formData.get("nouveau") !== formData.get("confirmation")) {
      setMessage({ ok: false, texte: "Les deux nouveaux mots de passe ne sont pas identiques." });
      return;
    }
    setOccupe(true);
    setMessage(null);
    try {
      const res = await fetch("/api/pedaleur/mot-de-passe", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actuel: formData.get("actuel"), nouveau: formData.get("nouveau") }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ ok: false, texte: d.error || "Une erreur est survenue." });
        return;
      }
      setMessage({ ok: true, texte: "Votre mot de passe a été changé." });
      setOuvert(false);
    } finally {
      setOccupe(false);
    }
  }

  return (
    <section className="mt-3 rounded-xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-marine-700">Mon mot de passe</h2>
        <button
          onClick={() => {
            setOuvert((v) => !v);
            setMessage(null);
          }}
          className="text-sm font-medium text-marine-600 hover:underline"
        >
          {ouvert ? "Fermer" : "Changer"}
        </button>
      </div>
      {ouvert && (
        <form action={changer} className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="actuel">
              Mot de passe actuel
            </label>
            <input id="actuel" name="actuel" type="password" required className="champ" autoComplete="current-password" />
          </div>
          <div>
            <label className="label" htmlFor="nouveau">
              Nouveau mot de passe
            </label>
            <input id="nouveau" name="nouveau" type="password" required minLength={6} className="champ" autoComplete="new-password" />
          </div>
          <div>
            <label className="label" htmlFor="confirmation">
              Encore une fois
            </label>
            <input id="confirmation" name="confirmation" type="password" required minLength={6} className="champ" autoComplete="new-password" />
          </div>
          <div className="sm:col-span-3">
            <button type="submit" disabled={occupe} className="btn-primary">
              Changer mon mot de passe
            </button>
          </div>
        </form>
      )}
      {message && (
        <p
          className={`mt-3 rounded-lg px-4 py-3 ${
            message.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {message.texte}
        </p>
      )}
    </section>
  );
}
