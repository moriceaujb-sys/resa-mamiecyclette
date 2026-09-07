"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LIBELLE_STATUT, ratioStatut, type StatutCreneau } from "@/lib/statut";

type CreneauAdmin = {
  id: string;
  date: string;
  dureeMinutes: number;
  lieuDepart: string;
  actif: boolean;
  nbBeneficiaires: number;
  aPedaleur: boolean;
  statut: StatutCreneau;
  beneficiaires: {
    nom: string;
    telephone: string;
    email: string | null;
    adresse: string | null;
    besoinsParticuliers: string | null;
    statut: string;
  }[];
  pedaleur: { nom: string; email: string } | null;
};

function fmt(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function toInputValue(iso: string): string {
  const p: Record<string, string> = {};
  for (const part of new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso)))
    p[part.type] = part.value;
  let h = p.hour;
  if (h === "24") h = "00";
  return `${p.year}-${p.month}-${p.day}T${h}:${p.minute}`;
}

const badge: Record<StatutCreneau, string> = {
  DISPO: "bg-slate-100 text-slate-500",
  CHERCHE_MOITIE: "bg-soleil-400/25 text-marine-700",
  COMPLET_ATTENTE_PEDALEUR: "bg-marine-100 text-marine-700",
  PEDALEUR_CHERCHE_PASSAGER: "bg-sky-100 text-sky-700",
  COMPLET_AVEC_PEDALEUR: "bg-green-100 text-green-700",
};

export default function CreneauxManager({
  creneaux,
}: {
  creneaux: CreneauAdmin[];
}) {
  const router = useRouter();
  const [occupe, setOccupe] = useState(false);
  const [montrerInactifs, setMontrerInactifs] = useState(false);
  const [ouverts, setOuverts] = useState<Set<string>>(new Set());
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const [editionId, setEditionId] = useState<string | null>(null);

  async function api(method: string, body: unknown): Promise<boolean> {
    setOccupe(true);
    try {
      const res = await fetch("/api/admin/creneaux", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "Action impossible.");
        return false;
      }
      router.refresh();
      return true;
    } finally {
      setOccupe(false);
    }
  }

  async function ajouter(formData: FormData) {
    const date = String(formData.get("date") || "");
    if (!date) {
      alert("Choisissez une date et une heure.");
      return;
    }
    const ok = await api("POST", {
      date: new Date(date).toISOString(),
      dureeMinutes: Number(formData.get("dureeMinutes") || 60),
      lieuDepart: String(formData.get("lieuDepart") || "Devant le CCAS"),
    });
    if (ok) setAjoutOuvert(false);
  }

  async function modifier(id: string, formData: FormData) {
    const date = String(formData.get("date") || "");
    const ok = await api("PATCH", {
      id,
      date: date ? new Date(date).toISOString() : undefined,
      dureeMinutes: Number(formData.get("dureeMinutes") || 60),
      lieuDepart: String(formData.get("lieuDepart") || "Devant le CCAS"),
    });
    if (ok) setEditionId(null);
  }

  async function supprimer(id: string) {
    if (
      !confirm(
        "Supprimer ce créneau ? Les réservations liées seront aussi supprimées. Il ne sera pas régénéré."
      )
    )
      return;
    await api("DELETE", { id });
  }

  function basculerDetails(id: string) {
    setOuverts((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  const visibles = creneaux.filter((c) => montrerInactifs || c.actif);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-marine-700">Créneaux</h1>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={montrerInactifs}
            onChange={(e) => setMontrerInactifs(e.target.checked)}
          />
          Afficher les créneaux désactivés
        </label>
        <button onClick={() => setAjoutOuvert((v) => !v)} className="btn-primary text-sm">
          {ajoutOuvert ? "Annuler" : "+ Ajouter un créneau"}
        </button>
      </div>

      {ajoutOuvert && (
        <form
          action={ajouter}
          className="mb-4 grid gap-3 rounded-xl bg-white p-5 shadow-sm sm:grid-cols-4"
        >
          <div className="sm:col-span-2">
            <label className="label text-sm">Date et heure</label>
            <input type="datetime-local" name="date" required className="champ text-base" />
          </div>
          <div>
            <label className="label text-sm">Durée (min)</label>
            <input type="number" name="dureeMinutes" min={5} max={480} defaultValue={60} className="champ text-base" />
          </div>
          <div>
            <label className="label text-sm">Lieu de départ</label>
            <input name="lieuDepart" defaultValue="Devant le CCAS" className="champ text-base" />
          </div>
          <div className="sm:col-span-4">
            <button type="submit" disabled={occupe} className="btn-primary text-base">
              Ajouter le créneau
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {visibles.length === 0 && (
          <p className="rounded-xl bg-white p-6 text-slate-500 shadow-sm">
            Aucun créneau à afficher.
          </p>
        )}
        {visibles.map((c) => {
          const ouvert = ouverts.has(c.id);
          const enEdition = editionId === c.id;
          return (
            <div key={c.id} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge[c.statut]}`}
                  >
                    {LIBELLE_STATUT[c.statut]} ({ratioStatut(c.nbBeneficiaires, c.aPedaleur)})
                  </span>
                  <span
                    className={`font-medium capitalize ${
                      c.actif ? "text-slate-800" : "text-slate-400 line-through"
                    }`}
                  >
                    {fmt(c.date)}
                  </span>
                  <span className="text-sm text-slate-400">{c.lieuDepart}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => basculerDetails(c.id)}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-marine-600 hover:bg-marine-50"
                  >
                    {ouvert ? "Masquer" : "Détails"}
                  </button>
                  <button
                    onClick={() => setEditionId(enEdition ? null : c.id)}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-marine-600 hover:bg-marine-50"
                  >
                    {enEdition ? "Fermer" : "Modifier"}
                  </button>
                  <button
                    disabled={occupe}
                    onClick={() => api("PATCH", { id: c.id, actif: !c.actif })}
                    className={`rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50 ${
                      c.actif
                        ? "bg-slate-200 text-slate-600 hover:bg-slate-300"
                        : "bg-marine-500 text-white hover:bg-marine-600"
                    }`}
                  >
                    {c.actif ? "Désactiver" : "Réactiver"}
                  </button>
                  <button
                    disabled={occupe}
                    onClick={() => supprimer(c.id)}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Supprimer
                  </button>
                </div>
              </div>

              {enEdition && (
                <form
                  action={(fd) => modifier(c.id, fd)}
                  className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-4"
                >
                  <div className="sm:col-span-2">
                    <label className="label text-sm">Date et heure</label>
                    <input
                      type="datetime-local"
                      name="date"
                      defaultValue={toInputValue(c.date)}
                      className="champ text-base"
                    />
                  </div>
                  <div>
                    <label className="label text-sm">Durée (min)</label>
                    <input type="number" name="dureeMinutes" min={5} max={480} defaultValue={c.dureeMinutes} className="champ text-base" />
                  </div>
                  <div>
                    <label className="label text-sm">Lieu de départ</label>
                    <input name="lieuDepart" defaultValue={c.lieuDepart} className="champ text-base" />
                  </div>
                  <div className="sm:col-span-4">
                    <button type="submit" disabled={occupe} className="btn-primary text-base">
                      Enregistrer
                    </button>
                  </div>
                </form>
              )}

              {ouvert && (
                <div className="mt-4 space-y-3 border-t border-slate-100 pt-3">
                  <div>
                    <h4 className="mb-1 text-sm font-semibold text-slate-500">
                      Bénéficiaires ({c.nbBeneficiaires}/2)
                    </h4>
                    {c.beneficiaires.length === 0 ? (
                      <p className="text-sm text-slate-400">
                        Aucun bénéficiaire pour l&apos;instant.
                      </p>
                    ) : (
                      <ul className="space-y-1">
                        {c.beneficiaires.map((b, i) => (
                          <li key={i} className="text-sm text-slate-600">
                            🧓 <strong>{b.nom}</strong> · 📞 {b.telephone}
                            {b.email ? ` · ✉️ ${b.email}` : ""}
                            {b.adresse ? ` · 📍 ${b.adresse}` : ""}
                            {b.besoinsParticuliers ? ` · 📝 ${b.besoinsParticuliers}` : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <h4 className="mb-1 text-sm font-semibold text-slate-500">Pédaleur</h4>
                    {c.pedaleur ? (
                      <p className="text-sm text-slate-600">
                        🚲 <strong>{c.pedaleur.nom}</strong> · ✉️ {c.pedaleur.email}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-400">Pas encore de pédaleur.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
