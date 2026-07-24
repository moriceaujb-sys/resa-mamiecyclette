"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CreneauBeneficiaire } from "@/lib/creneaux";

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

const PAS = 6; // journées révélées par palier (défilement infini)

export default function ReservationFlow({
  creneaux,
}: {
  creneaux: CreneauBeneficiaire[];
}) {
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [envoi, setEnvoi] = useState(false);
  const [resultat, setResultat] = useState<{ retenus: number; ignores: number } | null>(
    null
  );
  const [erreur, setErreur] = useState<string | null>(null);
  const [nbJours, setNbJours] = useState(PAS);
  const sentinelle = useRef<HTMLDivElement | null>(null);

  const parJour = useMemo(() => {
    const groupes = new Map<string, CreneauBeneficiaire[]>();
    for (const c of creneaux) {
      const cle = formatJour(c.date);
      if (!groupes.has(cle)) groupes.set(cle, []);
      groupes.get(cle)!.push(c);
    }
    return Array.from(groupes.entries());
  }, [creneaux]);

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

  function basculer(id: string) {
    setSelection((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function basculerJour(ids: string[]) {
    setSelection((prev) => {
      const n = new Set(prev);
      const tous = ids.every((id) => n.has(id));
      if (tous) ids.forEach((id) => n.delete(id));
      else ids.forEach((id) => n.add(id));
      return n;
    });
  }

  async function soumettre(formData: FormData) {
    if (selection.size === 0) {
      setErreur("Sélectionnez au moins un créneau.");
      return;
    }
    setEnvoi(true);
    setErreur(null);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creneauIds: Array.from(selection),
          nomClient: formData.get("nomClient"),
          telephone: formData.get("telephone"),
          email: formData.get("email"),
          adresse: formData.get("adresse"),
          besoinsParticuliers: formData.get("besoinsParticuliers"),
        }),
      });
      const data = await res.json();
      if (!res.ok) setErreur(data.error || "Une erreur est survenue.");
      else setResultat({ retenus: data.retenus, ignores: data.ignores });
    } catch {
      setErreur("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setEnvoi(false);
    }
  }

  if (resultat) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <div className="text-5xl" aria-hidden>
          🎉
        </div>
        <h2 className="mt-4 text-2xl font-bold text-marine-700">
          Vos disponibilités sont enregistrées !
        </h2>
        <p className="mt-2 text-lg text-slate-600">
          {resultat.retenus} créneau{resultat.retenus > 1 ? "x" : ""} retenu
          {resultat.retenus > 1 ? "s" : ""}.
          {resultat.ignores > 0 &&
            ` (${resultat.ignores} n'étaient plus disponibles.)`}
        </p>
        <p className="mt-2 text-slate-600">
          Dès qu&apos;un pédaleur confirme une balade, nous vous prévenons. Vos
          autres disponibilités sont alors libérées automatiquement.
        </p>
        <button
          className="btn-ghost mt-6"
          onClick={() => {
            setResultat(null);
            setSelection(new Set());
          }}
        >
          Envoyer d&apos;autres disponibilités
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
        <h2 className="mb-1 text-xl font-bold text-marine-700">
          1. Choisissez vos créneaux
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          Vous pouvez en sélectionner plusieurs, ou une journée entière.
        </p>
        <div className="space-y-5">
          {joursVisibles.map(([jour, liste]) => {
            const ids = liste.map((c) => c.id);
            const tous = ids.every((id) => selection.has(id));
            return (
              <div key={jour}>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-base font-semibold capitalize text-slate-500">
                    {jour}
                  </h3>
                  <button
                    type="button"
                    onClick={() => basculerJour(ids)}
                    className="text-sm font-medium text-marine-600 hover:underline"
                  >
                    {tous ? "Tout retirer" : "Toute la journée"}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {liste.map((c) => {
                    const sel = selection.has(c.id);
                    const chercheMoitie = c.nbBeneficiaires === 1;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => basculer(c.id)}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                          sel
                            ? "border-marine-500 bg-marine-500 text-white"
                            : "border-slate-300 bg-white hover:border-marine-500 hover:bg-marine-50"
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-sm font-bold ${
                            sel
                              ? "border-white bg-white text-marine-600"
                              : "border-slate-300 text-transparent"
                          }`}
                        >
                          ✓
                        </span>
                        <span>
                          <span className="block text-lg font-semibold leading-tight">
                            {formatHeure(c.date)}
                          </span>
                          <span
                            className={`text-sm ${
                              sel
                                ? "text-marine-50"
                                : chercheMoitie
                                ? "font-medium text-marine-600"
                                : "text-slate-500"
                            }`}
                          >
                            {chercheMoitie ? "Une personne attend !" : "Libre"}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
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
        <form
          action={soumettre}
          className="space-y-4 rounded-2xl bg-white p-6 shadow-sm lg:sticky lg:top-4"
        >
          <div className="rounded-lg bg-marine-50 px-4 py-3 text-sm text-marine-700">
            {selection.size === 0
              ? "Aucun créneau sélectionné pour l'instant."
              : `${selection.size} créneau${
                  selection.size > 1 ? "x" : ""
                } sélectionné${selection.size > 1 ? "s" : ""}.`}
          </div>

          <div>
            <label className="label" htmlFor="nomClient">
              Nom et prénom *
            </label>
            <input id="nomClient" name="nomClient" required className="champ" autoComplete="name" />
          </div>

          <div>
            <label className="label" htmlFor="telephone">
              Téléphone *
            </label>
            <input id="telephone" name="telephone" required type="tel" className="champ" autoComplete="tel" />
          </div>

          <div>
            <label className="label" htmlFor="email">
              Email (facultatif)
            </label>
            <input id="email" name="email" type="email" className="champ" autoComplete="email" />
          </div>

          <div>
            <label className="label" htmlFor="adresse">
              Adresse de prise en charge (facultatif)
            </label>
            <input id="adresse" name="adresse" className="champ" />
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
            <p className="rounded-lg bg-red-50 px-4 py-3 text-red-700">{erreur}</p>
          )}

          <button
            type="submit"
            className="btn-soleil w-full"
            disabled={envoi || selection.size === 0}
          >
            {envoi ? "Envoi en cours…" : "Envoyer mes disponibilités"}
          </button>
        </form>
      </section>
    </div>
  );
}
