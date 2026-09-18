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
  const [mode, setMode] = useState<"PERSONNE" | "STRUCTURE">("PERSONNE");
  const [envoi, setEnvoi] = useState(false);
  const [resultat, setResultat] = useState<{
    retenus: number;
    ignores: number;
    confirmeDirect: boolean;
    structure: boolean;
  } | null>(null);
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

  // Une structure prend le créneau entier : seuls les créneaux sans bénéficiaire
  // ni pédaleur lui sont proposés.
  const libreEntier = useMemo(() => {
    const m = new Map<string, boolean>();
    for (const c of creneaux) m.set(c.id, c.nbBeneficiaires === 0 && !c.aPedaleur);
    return m;
  }, [creneaux]);

  function changerMode(m: "PERSONNE" | "STRUCTURE") {
    setMode(m);
    setErreur(null);
    if (m === "STRUCTURE") {
      // On retire de la sélection les créneaux qu'une structure ne peut pas prendre.
      setSelection((prev) => new Set(Array.from(prev).filter((id) => libreEntier.get(id))));
    }
  }

  function basculer(id: string) {
    if (mode === "STRUCTURE" && !libreEntier.get(id)) return;
    setSelection((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function basculerJour(idsJour: string[]) {
    const ids =
      mode === "STRUCTURE" ? idsJour.filter((id) => libreEntier.get(id)) : idsJour;
    if (ids.length === 0) return;
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
          type: mode,
          creneauIds: Array.from(selection),
          nomClient: formData.get("nomClient"),
          telephone: formData.get("telephone"),
          email: formData.get("email"),
          adresse: formData.get("adresse"),
          besoinsParticuliers: formData.get("besoinsParticuliers"),
          nbBeneficiairesEstime: formData.get("nbBeneficiairesEstime") || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) setErreur(data.error || "Une erreur est survenue.");
      else
        setResultat({
          retenus: data.retenus,
          ignores: data.ignores,
          confirmeDirect: !!data.confirmeDirect,
          structure: !!data.structure,
        });
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
          {resultat.structure ? "🏢" : resultat.confirmeDirect ? "✅" : "🎉"}
        </div>
        {resultat.structure ? (
          <>
            <h2 className="mt-4 text-2xl font-bold text-marine-700">
              Réservation enregistrée pour la structure !
            </h2>
            <p className="mt-2 text-lg text-slate-600">
              {resultat.retenus} créneau{resultat.retenus > 1 ? "x" : ""} réservé
              {resultat.retenus > 1 ? "s" : ""} entièrement.
              {resultat.ignores > 0 &&
                ` (${resultat.ignores} n'étaient plus disponibles.)`}
            </p>
            <p className="mt-2 text-slate-600">
              La structure vient avec son propre pédaleur : ces créneaux ne sont
              plus proposés aux bénéficiaires ni aux pédaleurs bénévoles.
            </p>
          </>
        ) : resultat.confirmeDirect ? (
          <>
            <h2 className="mt-4 text-2xl font-bold text-marine-700">
              Votre balade est confirmée !
            </h2>
            <p className="mt-2 text-lg text-slate-600">
              Un pédaleur était déjà prêt sur ce créneau : votre balade est
              réservée. Nous vous recontactons avec les détails.
            </p>
          </>
        ) : (
          <>
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
              Dès qu&apos;un pédaleur confirme une balade, nous vous prévenons.
              Vos autres disponibilités sont alors libérées automatiquement.
            </p>
          </>
        )}
        <button
          className="btn-ghost mt-6"
          onClick={() => {
            setResultat(null);
            setSelection(new Set());
          }}
        >
          Enregistrer une autre réservation
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
        <p className="mb-4 text-sm text-slate-600">
          Vous pouvez en sélectionner plusieurs, ou une journée entière.
        </p>
        <div className="space-y-5">
          {joursVisibles.map(([jour, liste]) => {
            const ids = liste.map((c) => c.id);
            const tous = ids.every((id) => selection.has(id));
            return (
              <div key={jour}>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-base font-semibold capitalize text-slate-600">
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
                    const pedaleurPret = c.aPedaleur;
                    const chercheMoitie = c.nbBeneficiaires === 1;
                    const bloque = mode === "STRUCTURE" && !libreEntier.get(c.id);
                    let sousTitre = "Libre";
                    if (pedaleurPret) sousTitre = "🚲 Un pédaleur est prêt !";
                    else if (chercheMoitie) sousTitre = "Une personne attend !";
                    if (bloque) sousTitre = "Déjà partiellement pris";
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => basculer(c.id)}
                        disabled={bloque}
                        title={bloque ? "Une structure ne peut prendre qu'un créneau entièrement libre." : undefined}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                          sel
                            ? "border-marine-500 bg-marine-500 text-white"
                            : bloque
                            ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                            : pedaleurPret
                            ? "border-green-500 bg-green-50 hover:bg-green-100"
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
                                : bloque
                                ? "text-slate-400"
                                : pedaleurPret
                                ? "font-medium text-green-700"
                                : chercheMoitie
                                ? "font-medium text-marine-600"
                                : "text-slate-600"
                            }`}
                          >
                            {sousTitre}
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
            className="py-8 text-center text-sm text-slate-600"
          >
            Chargement d&apos;autres dates…
          </div>
        )}
      </section>

      {/* Colonne formulaire */}
      <section className="lg:col-span-2">
        <h2 className="mb-4 text-xl font-bold text-marine-700">
          2. Coordonnées
        </h2>
        <form
          action={soumettre}
          className="space-y-4 rounded-2xl bg-white p-6 shadow-sm lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto"
        >
          {/* Switch personne / structure */}
          <div
            role="radiogroup"
            aria-label="Type de réservation"
            className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1"
          >
            {(
              [
                ["PERSONNE", "🧓 Un bénéficiaire"],
                ["STRUCTURE", "🏢 Une structure"],
              ] as const
            ).map(([val, lib]) => (
              <button
                key={val}
                type="button"
                role="radio"
                aria-checked={mode === val}
                onClick={() => changerMode(val)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  mode === val
                    ? "bg-white text-marine-700 shadow-sm"
                    : "text-slate-600 hover:text-marine-700"
                }`}
              >
                {lib}
              </button>
            ))}
          </div>
          {mode === "STRUCTURE" && (
            <p className="text-sm text-slate-600">
              Une structure (EHPAD, association…) réserve le créneau{" "}
              <strong>entier</strong> et vient avec son propre pédaleur.
            </p>
          )}

          <div className="rounded-lg bg-marine-50 px-4 py-3 text-sm text-marine-700">
            {selection.size === 0
              ? "Aucun créneau sélectionné pour l'instant."
              : `${selection.size} créneau${
                  selection.size > 1 ? "x" : ""
                } sélectionné${selection.size > 1 ? "s" : ""}.`}
          </div>

          <div>
            <label className="label" htmlFor="nomClient">
              {mode === "STRUCTURE" ? "Nom de la structure *" : "Nom et prénom *"}
            </label>
            <input
              id="nomClient"
              name="nomClient"
              required
              className="champ"
              autoComplete={mode === "STRUCTURE" ? "organization" : "name"}
              placeholder={mode === "STRUCTURE" ? "Ex. EHPAD Les Tilleuls" : undefined}
            />
          </div>

          <div>
            <label className="label" htmlFor="telephone">
              Téléphone *
            </label>
            <input id="telephone" name="telephone" required type="tel" className="champ" autoComplete="tel" />
          </div>

          <div>
            <label className="label" htmlFor="email">
              {mode === "STRUCTURE" ? "Email *" : "Email (facultatif)"}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required={mode === "STRUCTURE"}
              className="champ"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="label" htmlFor="adresse">
              {mode === "STRUCTURE"
                ? "Adresse postale *"
                : "Adresse de prise en charge (facultatif)"}
            </label>
            <input
              id="adresse"
              name="adresse"
              required={mode === "STRUCTURE"}
              className="champ"
              autoComplete={mode === "STRUCTURE" ? "street-address" : undefined}
            />
          </div>

          {mode === "STRUCTURE" && (
            <div>
              <label className="label" htmlFor="nbBeneficiairesEstime">
                Nombre estimé de bénéficiaires promenés *
              </label>
              <input
                id="nbBeneficiairesEstime"
                name="nbBeneficiairesEstime"
                type="number"
                min={1}
                max={500}
                required
                className="champ"
                placeholder="Ex. 6"
              />
            </div>
          )}

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
            {envoi
              ? "Envoi en cours…"
              : mode === "STRUCTURE"
              ? "Réserver pour la structure"
              : "Enregistrer les disponibilités"}
          </button>
        </form>
      </section>
    </div>
  );
}
