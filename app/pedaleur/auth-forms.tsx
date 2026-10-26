"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Telephone from "@/app/telephone";
import { TEL_MAMIE_CYCLETTE } from "@/app/infos-pedaleur";

type Mode = "connexion" | "inscription";

export default function AuthForms({
  modeInitial = "connexion",
}: {
  modeInitial?: Mode;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(modeInitial);
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
            telephone: formData.get("telephone"),
            dateNaissance: formData.get("dateNaissance"),
            adresse: formData.get("adresse"),
          };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      // Le tableau de bord est rendu sur la page d'accueil pour un pédaleur connecté.
      router.push("/");
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
        <p className="mt-2 text-slate-600">
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
                  : "text-slate-600 hover:text-marine-600"
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
          {mode === "inscription" && (
            <>
              <div>
                <label className="label" htmlFor="dateNaissance">
                  Date de naissance
                </label>
                <input
                  id="dateNaissance"
                  name="dateNaissance"
                  type="date"
                  required
                  className="champ"
                  autoComplete="bday"
                />
              </div>
              <div>
                <label className="label" htmlFor="adresse">
                  Adresse postale
                </label>
                <input
                  id="adresse"
                  name="adresse"
                  required
                  className="champ"
                  autoComplete="street-address"
                />
              </div>
              <div>
                <label className="label" htmlFor="telephone">
                  Téléphone
                </label>
                <input
                  id="telephone"
                  name="telephone"
                  type="tel"
                  required
                  className="champ"
                  autoComplete="tel"
                />
              </div>
            </>
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
          {mode === "inscription" && (
            <p className="rounded-lg bg-marine-50 px-4 py-3 text-sm text-marine-700">
              Toutes ces informations sont demandées pour l&apos;
              <strong>assurance du CCAS</strong>, qui couvre les pédaleurs pendant
              les balades.
            </p>
          )}
          {erreur && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-red-700">{erreur}</p>
          )}
          {mode === "connexion" && (
            <p className="text-sm text-slate-600">
              Mot de passe oublié ? Appelez Mamie Cyclette au{" "}
              <Telephone numero={TEL_MAMIE_CYCLETTE} /> : l&apos;équipe vous donnera
              un mot de passe provisoire.
            </p>
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
      <p className="mt-4 text-center text-sm text-slate-600">
        <Link href="/" className="underline hover:text-marine-700">
          Découvrir Mamie Cyclette et les balades
        </Link>
      </p>
    </div>
  );
}
