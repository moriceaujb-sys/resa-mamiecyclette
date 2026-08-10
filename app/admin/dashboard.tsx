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
  PEDALEUR_CHERCHE_PASSAGER: "bg-sky-100 text-sky-700",
  COMPLET_AVEC_PEDALEUR: "bg-green-100 text-green-700",
};

export default function Dashboard({ creneaux }: { creneaux: CreneauAdmin[] }) {
  const router = useRouter();
  const [onglet, setOnglet] = useState<"creneaux" | "aide">("creneaux");
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

      <div className="mb-6 flex gap-2 border-b border-slate-200">
        {([
          ["creneaux", "Créneaux"],
          ["aide", "Aide & doc"],
        ] as const).map(([cle, label]) => (
          <button
            key={cle}
            onClick={() => setOnglet(cle)}
            className={`-mb-px border-b-2 px-4 py-2 font-medium ${
              onglet === cle
                ? "border-marine-500 text-marine-700"
                : "border-transparent text-slate-400 hover:text-marine-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {onglet === "creneaux" && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2 text-slate-600">
              <input
                type="checkbox"
                checked={montrerInactifs}
                onChange={(e) => setMontrerInactifs(e.target.checked)}
              />
              Afficher les créneaux désactivés
            </label>
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
                        {LIBELLE_STATUT[c.statut]} (
                        {ratioStatut(c.nbBeneficiaires, c.aPedaleur)})
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
        </>
      )}

      {onglet === "aide" && <Aide />}
    </div>
  );
}

function Aide() {
  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-bold text-marine-700">
          Comment se construit une balade
        </h2>
        <p className="text-slate-700">
          Chaque créneau réunit <strong>2 bénéficiaires</strong> (passagers) et{" "}
          <strong>1 pédaleur</strong> (bénévole). Les bénéficiaires déclarent
          leurs disponibilités depuis la page d&apos;accueil (sans compte, un ou
          plusieurs créneaux). Les pédaleurs, connectés à leur compte, prennent
          en charge les créneaux.
        </p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-lg font-bold text-marine-700">
          Les statuts d&apos;un créneau
        </h2>
        <ul className="space-y-2 text-slate-700">
          <li>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              Dispo (0/2)
            </span>{" "}
            — aucun bénéficiaire.
          </li>
          <li>
            <span className="rounded-full bg-soleil-400/25 px-2 py-0.5 text-xs font-medium text-marine-700">
              Cherche sa moitié (1/2)
            </span>{" "}
            — 1 bénéficiaire, on attend le second.
          </li>
          <li>
            <span className="rounded-full bg-marine-100 px-2 py-0.5 text-xs font-medium text-marine-700">
              En attente d&apos;un pédaleur (2/3)
            </span>{" "}
            — 2 bénéficiaires prêts, visible par les pédaleurs.
          </li>
          <li>
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
              Pédaleur trouvé, cherche un passager (2/3)
            </span>{" "}
            — un pédaleur s&apos;est positionné sur un créneau qui n&apos;avait
            qu&apos;un bénéficiaire ; un 2e passager peut encore rejoindre.
          </li>
          <li>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              Complet avec pédaleur (3/3)
            </span>{" "}
            — 2 bénéficiaires + 1 pédaleur, la balade est bouclée.
          </li>
        </ul>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-bold text-marine-700">
          La règle de libération
        </h2>
        <p className="text-slate-700">
          Quand un pédaleur confirme un créneau, <strong>seuls les bénéficiaires
          de ce créneau</strong> voient leurs <em>autres</em> disponibilités
          libérées (ils ont trouvé leur balade). Tous les autres bénéficiaires —
          ceux qui n&apos;ont pas encore de balade — <strong>conservent
          l&apos;intégralité de leurs créneaux</strong>. Un créneau qu&apos;un
          bénéficiaire quitte ainsi repasse simplement en 1/2 ou 0/2 : personne
          n&apos;est jamais supprimé.
        </p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-bold text-marine-700">Vos actions ici</h2>
        <p className="text-slate-700">
          Dans l&apos;onglet <strong>Créneaux</strong>, vous voyez le statut de
          chaque créneau, vous pouvez <strong>activer / désactiver</strong> un
          créneau, et déplier les <strong>détails</strong> (coordonnées des
          bénéficiaires et du pédaleur). Les créneaux se génèrent
          automatiquement sur les mois à venir.
        </p>
      </div>
    </div>
  );
}
