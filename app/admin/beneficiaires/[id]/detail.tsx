"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { BeneficiaireDetail } from "@/lib/beneficiaires";

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

const LIBELLE_DISPO: Record<string, string> = {
  EN_ATTENTE: "En attente",
  CONFIRMEE: "Confirmée (pédaleur)",
  LIBEREE: "Libérée",
  ANNULEE: "Annulée",
};
const BADGE_DISPO: Record<string, string> = {
  EN_ATTENTE: "bg-soleil-400/25 text-marine-700",
  CONFIRMEE: "bg-green-100 text-green-700",
  LIBEREE: "bg-slate-100 text-slate-600",
  ANNULEE: "bg-red-100 text-red-700",
};

export default function BeneficiaireDetailVue({ b }: { b: BeneficiaireDetail }) {
  const router = useRouter();
  const [occupe, setOccupe] = useState(false);
  const [edition, setEdition] = useState(false);

  async function requete(url: string, method: string, body: unknown): Promise<boolean> {
    setOccupe(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "Action impossible.");
        return false;
      }
      return true;
    } finally {
      setOccupe(false);
    }
  }

  async function modifier(formData: FormData) {
    const ok = await requete("/api/admin/beneficiaires", "PATCH", {
      id: b.id,
      nom: formData.get("nom"),
      telephone: formData.get("telephone"),
      email: formData.get("email"),
      adresse: formData.get("adresse"),
      besoinsParticuliers: formData.get("besoinsParticuliers"),
    });
    if (ok) {
      setEdition(false);
      router.refresh();
    }
  }

  async function supprimerPersonne() {
    if (
      !confirm(
        `Supprimer définitivement ${b.nom} et tous ses créneaux ? Cette action est irréversible.`
      )
    )
      return;
    const ok = await requete("/api/admin/beneficiaires", "DELETE", { id: b.id });
    if (ok) router.push("/admin/beneficiaires");
  }

  async function nettoyer() {
    if (
      !confirm(
        "Supprimer tous les créneaux de cette personne qui n'ont pas encore de pédaleur ? (Les balades déjà confirmées sont conservées.)"
      )
    )
      return;
    const ok = await requete("/api/admin/disponibilites", "POST", {
      beneficiaireId: b.id,
    });
    if (ok) router.refresh();
  }

  async function supprimerDispo(id: string) {
    if (!confirm("Retirer ce créneau du bénéficiaire ?")) return;
    const ok = await requete("/api/admin/disponibilites", "DELETE", { id });
    if (ok) router.refresh();
  }

  return (
    <div className="space-y-5">
      <Link href="/admin/beneficiaires" className="text-sm text-marine-600 hover:underline">
        ← Retour à la liste
      </Link>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-marine-700">{b.nom}</h1>
            <p className="text-sm text-slate-600">
              Fiche créée le {fmt(b.createdAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setEdition((v) => !v)} className="btn-ghost text-sm">
              {edition ? "Fermer" : "Modifier"}
            </button>
            <button
              onClick={nettoyer}
              disabled={occupe}
              className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300 disabled:opacity-50"
            >
              Nettoyer les créneaux non confirmés
            </button>
            <button
              onClick={supprimerPersonne}
              disabled={occupe}
              className="rounded-lg bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
            >
              Supprimer
            </button>
          </div>
        </div>

        {edition ? (
          <form action={modifier} className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Nom et prénom *</label>
              <input name="nom" required defaultValue={b.nom} className="champ" />
            </div>
            <div>
              <label className="label">Téléphone *</label>
              <input name="telephone" required defaultValue={b.telephone} className="champ" />
            </div>
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" defaultValue={b.email || ""} className="champ" />
            </div>
            <div>
              <label className="label">Adresse</label>
              <input name="adresse" defaultValue={b.adresse || ""} className="champ" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Besoins particuliers</label>
              <textarea
                name="besoinsParticuliers"
                rows={2}
                defaultValue={b.besoinsParticuliers || ""}
                className="champ"
              />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" disabled={occupe} className="btn-primary">
                Enregistrer
              </button>
            </div>
          </form>
        ) : (
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-600">Téléphone</dt>
              <dd className="text-slate-800">{b.telephone}</dd>
            </div>
            <div>
              <dt className="text-slate-600">Email</dt>
              <dd className="text-slate-800">{b.email || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-600">Adresse</dt>
              <dd className="text-slate-800">{b.adresse || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-600">Besoins particuliers</dt>
              <dd className="text-slate-800">{b.besoinsParticuliers || "—"}</dd>
            </div>
          </dl>
        )}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-lg font-bold text-marine-700">
          Créneaux de ce bénéficiaire ({b.disponibilites.length})
        </h2>
        {b.disponibilites.length === 0 ? (
          <p className="text-sm text-slate-600">Aucun créneau.</p>
        ) : (
          <ul className="space-y-2">
            {b.disponibilites.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      BADGE_DISPO[d.statut] || "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {LIBELLE_DISPO[d.statut] || d.statut}
                  </span>
                  <span className="font-medium capitalize text-slate-800">
                    {fmt(d.creneauDate)}
                  </span>
                  <span className="text-sm text-slate-600">{d.lieuDepart}</span>
                  {d.pedaleurNom && (
                    <span className="text-sm text-green-700">🚲 {d.pedaleurNom}</span>
                  )}
                </div>
                <button
                  onClick={() => supprimerDispo(d.id)}
                  disabled={occupe}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
