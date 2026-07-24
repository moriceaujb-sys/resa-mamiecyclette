"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthForms() {
  const router = useRouter();
  const [mode, setMode] = useState<"connexion" | "inscription">("connexion");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  async function soumettre(formData: FormData) {
    setEnvoi(true);
    setErreur(null);
    const url =
      mode === "connexion"
        ? "/api/pedaleur/connexion"
        : "/api/pedaleur/inscription";
    const body =
      mode === "connexion"
        ? {
            email: formData.get("email"),
            motDePasse: formData.get("motDePasse"),
          }
        : {
            nom: formData.get("nom"),
            email: formData.get("email"),
            motDePasse: formData.get("motDePasse"),
          };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setErreur(d.error || "Une erreur est survenue.");
      setEnvoi(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-marine-700">Espace pédaleur</h1>
        <p className="mt-2 text-slate-500">
          Connectez-vous pour confirmer des balades et emmener les bénéficiaires.
        </p>
        <div className="mt-4 flex gap-1 rounded-lg bg-slate-100 p-1">
          {(["connexion", "inscription"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setErreur(null);
              }}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                mode === m
                  ? "bg-white text-marine-700 shadow"
                  : "text-slate-500 hover:text-marine-600"
              }`}
            >
              {m === "connexion" ? "Connexion" : "Créer un compte"}
            </button>
          ))}
        </div>
        <form action={soumettre} className="mt-5 space-y-4">
          {mode === "inscription" && (
            <div>
              <label className="label" htmlFor="nom">
                Nom et prénom
              </label>
              <input id="nom" name="nom" required className="champ" autoComplete="name" />
            </div>
          )}
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input id="email" name="email" type="email" required className="champ" autoComplete="email" />
          </div>
          <div>
            <label className="label" htmlFor="motDePasse">
              Mot de passe
            </label>
            <input
              id="motDePasse"
              name="motDePasse"
              type="password"
              required
              className="champ"
              autoComplete={mode === "connexion" ? "current-password" : "new-password"}
            />
          </div>
          {erreur && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-red-700">{erreur}</p>
          )}
          <button type="submit" className="btn-primary w-full" disabled={envoi}>
            {envoi
              ? "Un instant…"
              : mode === "connexion"
              ? "Se connecter"
              : "Créer mon compte"}
          </button>
        </form>
      </div>
    </div>
  );
}
