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

const badge: Record<StatutCreneau, string> = {
  DISPO: "bg-slate-100 text-slate-500",
  CHERCHE_MOITIE: "bg-soleil-400/25 text-marine-700",
  COMPLET_ATTENTE_PEDALEUR: "bg-marine-100 text-marine-700",
  COMPLET_AVEC_PEDALEUR: "bg-green-100 text-green-700",
};

export default function Dashboard({ creneaux }: { creneaux: CreneauAdmin[] }) {
  const router = useRouter();
  const [occupe, setOccupe] = useState(false);
  const [montrerInactifs, setMontrerInactifs] = useState(false);
  const [ouverts, setOuverts] = useState<Set<string>>(new Set());

  async function deconnexion() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  async function basculerActif(id: string, actif: boolean) {
    setOccupe(true);
    try {
      const res = await fetch("/api/admin/creneaux", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, actif }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "Action impossible.");
      }
      router.refresh();
    } finally {
      setOccupe(false);
    }
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
  const enAttentePedaleur = creneaux.filter(
    (c) => c.statut === "COMPLET_ATTENTE_PEDALEUR"
  ).length;
  const complets = creneaux.filter(
    (c) => c.statut === "COMPLET_AVEC_PEDALEUR"
  ).length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-marine-700">Espace équipe</h1>
          <p className="text-slate-500">
            {enAttentePedaleur} en attente d&apos;un pédaleur · {complets} balade
            {complets > 1 ? "s" : ""} complète{complets > 1 ? "s" : ""} ·{" "}
            {creneaux.filter((c) => c.actif).length} créneaux actifs
          </p>
        </div>
        <button onClick={deconnexion} className="btn-ghost text-base">
          Se déconnecter
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
        <label className="flex items-center gap-2 text-slate-600">
          <input
            type="checkbox"
            checked={montrerInactifs}
            onChange={(e) => setMontrerInactifs(e.target.checked)}
          />
          Afficher les créneaux désactivés
        </label>
        <span className="text-slate-400">
          Légende : Dispo (0/2) · Cherche sa moitié (1/2) · En attente d&apos;un
          pédaleur (2/3) · Complet (3/3)
        </span>
      </div>

      <div className="space-y-2">
        {visibles.length === 0 && (
          <p className="rounded-xl bg-white p-6 text-slate-500 shadow-sm">
            Aucun créneau à afficher.
          </p>
        )}
        {visibles.map((c) => {
          const ouvert = ouverts.has(c.id);
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => basculerDetails(c.id)}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-marine-600 hover:bg-marine-50"
                  >
                    {ouvert ? "Masquer" : "Détails"}
                  </button>
                  <button
                    disabled={occupe}
                    onClick={() => basculerActif(c.id, !c.actif)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50 ${
                      c.actif
                        ? "bg-slate-200 text-slate-600 hover:bg-slate-300"
                        : "bg-marine-500 text-white hover:bg-marine-600"
                    }`}
                  >
                    {c.actif ? "Désactiver" : "Réactiver"}
                  </button>
                </div>
              </div>

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
                            {b.besoinsParticuliers
                              ? ` · 📝 ${b.besoinsParticuliers}`
                              : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <h4 className="mb-1 text-sm font-semibold text-slate-500">
                      Pédaleur
                    </h4>
                    {c.pedaleur ? (
                      <p className="text-sm text-slate-600">
                        🚲 <strong>{c.pedaleur.nom}</strong> · ✉️{" "}
                        {c.pedaleur.email}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-400">
                        Pas encore de pédaleur.
                      </p>
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
