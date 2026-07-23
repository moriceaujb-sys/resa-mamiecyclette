"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  async function soumettre(formData: FormData) {
    setEnvoi(true);
    setErreur(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: formData.get("password") }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setErreur(data.error || "Connexion impossible.");
      setEnvoi(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-marine-700">Espace équipe</h1>
        <p className="mt-2 text-slate-500">
          Réservé au CCAS et aux bénévoles.
        </p>
        <form action={soumettre} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="password">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="champ"
              autoFocus
            />
          </div>
          {erreur && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-red-700">
              {erreur}
            </p>
          )}
          <button type="submit" className="btn-primary w-full" disabled={envoi}>
            {envoi ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
