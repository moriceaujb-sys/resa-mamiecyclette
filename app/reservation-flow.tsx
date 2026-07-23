"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CreneauDisponible } from "@/lib/creneaux";

function formatJour(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(iso));
}

function formatHeure(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

// Nombre de journées révélées à chaque palier de défilement.
const PAS = 6;

export default function ReservationFlow({
  creneaux,
}: {
  creneaux: CreneauDisponible[];
}) {
  const [choisi, setChoisi] = useState<CreneauDisponible | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [succes, setSucces] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [nbJours, setNbJours] = useState(PAS);
  const sentinelle = useRef<HTMLDivElement | null>(null);

  // Regroupe les créneaux par jour pour un affichage type calendrier.
  const parJour = useMemo(() => {
    const groupes = new Map<string, CreneauDisponible[]>();
    for (const c of creneaux) {
      const cle = formatJour(c.date);
      if (!groupes.has(cle)) groupes.set(cle, []);
      groupes.get(cle)!.push(c);
    }
    return Array.from(groupes.entries());
  }, [creneaux]);

  // Défilement infini : révèle plus de journées quand la sentinelle devient visible.
  useEffect(() => {
    const el = sentinelle.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setNbJours((n) => Math.min(n + PAS, parJour.length));
        }
      },
      { rootMargin: "300px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [parJour.length]);

  async function soumettre(formData: FormData) {
    if (!choisi) return;
    setEnvoi(true);
    setErreur(null);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creneauId: choisi.id,
          nomClient: formData.get("nomClient"),
          telephone: formData.get("telephone"),
          email: formData.get("email"),
          adresse: formData.get("adresse"),
          nombrePersonnes: Number(formData.get("nombrePersonnes") || 1),
          besoinsParticuliers: formData.get("besoinsParticuliers"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data.error || "Une erreur est survenue.");
      } else {
        setSucces(true);
      }
    } catch {
      setErreur("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setEnvoi(false);
    }
  }

  if (succes) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <div className="text-5xl" aria-hidden>
          🎉
        </div>
        <h2 className="mt-4 text-2xl font-bold text-marine-700">
          Votre demande est enregistrée !
        </h2>
        <p className="mt-2 text-lg text-slate-600">
          L&apos;équipe du CCAS va la confirmer prochainement. Si vous avez
          indiqué un email, vous recevez un récapitulatif.
        </p>
        <button
          className="btn-ghost mt-6"
          onClick={() => {
            setSucces(false);
            setChoisi(null);
          }}
        >
          Réserver une autre balade
        </button>
      </div>
    );
  }

  if (creneaux.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="text-lg text-slate-600">
          Aucun créneau n&apos;est disponible pour le moment. Revenez bientôt ou
          contactez le CCAS.
        </p>
      </div>
    );
  }

  const joursVisibles = parJour.slice(0, nbJours);

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Colonne créneaux */}
      <section className="lg:col-span-3">
        <h2 className="mb-4 text-xl font-bold text-marine-700">
          1. Choisissez un créneau
        </h2>
        <div className="space-y-5">
          {joursVisibles.map(([jour, liste]) => (
            <div key={jour}>
              <h3 className="mb-2 text-base font-semibold capitalize text-slate-500">
                {jour}
              </h3>
              <div className="flex flex-wrap gap-2">
                {liste.map((c) => {
                  const complet = c.placesRestantes <= 0;
                  const actif = choisi?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      disabled={complet}
                      onClick={() => setChoisi(c)}
                      className={`rounded-xl border px-4 py-3 text-left transition ${
                        actif
                          ? "border-marine-500 bg-marine-500 text-white"
                          : complet
                          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                          : "border-slate-300 bg-white hover:border-marine-500 hover:bg-marine-50"
                      }`}
                    >
                      <div className="text-lg font-semibold">
                        {formatHeure(c.date)}
                      </div>
                      <div
                        className={`text-sm ${
                          actif ? "text-marine-50" : "text-slate-500"
                        }`}
                      >
                        {complet
                          ? "Complet"
                          : `${c.placesRestantes} place${
                              c.placesRestantes > 1 ? "s" : ""
                            }`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {nbJours < parJour.length && (
          <div
            ref={sentinelle}
            className="py-8 text-center text-sm text-slate-400"
          >
            Chargement d&apos;autres dates…
          </div>
        )}
      </section>

      {/* Colonne formulaire */}
      <section className="lg:col-span-2">
        <h2 className="mb-4 text-xl font-bold text-marine-700">
          2. Vos coordonnées
        </h2>
        {!choisi ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-6 text-center text-slate-500">
            Sélectionnez d&apos;abord un créneau à gauche.
          </div>
        ) : (
          <form
            action={soumettre}
            className="space-y-4 rounded-2xl bg-white p-6 shadow-sm"
          >
            <div className="rounded-lg bg-marine-50 px-4 py-3 text-sm text-marine-700">
              Créneau choisi :{" "}
              <strong className="capitalize">
                {formatJour(choisi.date)} à {formatHeure(choisi.date)}
              </strong>
            </div>

            <div>
              <label className="label" htmlFor="nomClient">
                Nom et prénom *
              </label>
              <input
                id="nomClient"
                name="nomClient"
                required
                className="champ"
                autoComplete="name"
              />
            </div>

            <div>
              <label className="label" htmlFor="telephone">
                Téléphone *
              </label>
              <input
                id="telephone"
                name="telephone"
                required
                type="tel"
                className="champ"
                autoComplete="tel"
              />
            </div>

            <div>
              <label className="label" htmlFor="email">
                Email (facultatif)
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="champ"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label" htmlFor="adresse">
                Adresse de prise en charge (facultatif)
              </label>
              <input id="adresse" name="adresse" className="champ" />
            </div>

            <div>
              <label className="label" htmlFor="nombrePersonnes">
                Nombre de personnes
              </label>
              <select
                id="nombrePersonnes"
                name="nombrePersonnes"
                className="champ"
                defaultValue={1}
              >
                {Array.from(
                  { length: choisi.placesRestantes },
                  (_, i) => i + 1
                ).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="besoinsParticuliers">
                Besoins particuliers (facultatif)
              </label>
              <textarea
                id="besoinsParticuliers"
                name="besoinsParticuliers"
                rows={2}
                className="champ"
                placeholder="Mobilité réduite, accompagnement, etc."
              />
            </div>

            {erreur && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-red-700">
                {erreur}
              </p>
            )}

            <button type="submit" className="btn-soleil w-full" disabled={envoi}>
              {envoi ? "Envoi en cours…" : "Réserver ma balade"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
