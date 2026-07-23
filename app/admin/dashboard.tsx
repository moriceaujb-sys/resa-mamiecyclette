"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CreneauDto = {
  id: string;
  date: string;
  dureeMinutes: number;
  capaciteMax: number;
  lieuDepart: string;
  actif: boolean;
  placesRestantes: number;
};

type ReservationDto = {
  id: string;
  nomClient: string;
  telephone: string;
  email: string | null;
  adresse: string | null;
  nombrePersonnes: number;
  besoinsParticuliers: string | null;
  statut: "EN_ATTENTE" | "CONFIRMEE" | "ANNULEE";
  source: "PUBLIC" | "INTERNE";
  creneauDate: string;
  lieuDepart: string;
  createdAt: string;
};

function fmtDateHeure(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

const badge: Record<ReservationDto["statut"], string> = {
  EN_ATTENTE: "bg-soleil-400/20 text-soleil-500",
  CONFIRMEE: "bg-green-100 text-green-700",
  ANNULEE: "bg-slate-200 text-slate-500 line-through",
};

const libelleStatut: Record<ReservationDto["statut"], string> = {
  EN_ATTENTE: "En attente",
  CONFIRMEE: "Confirmée",
  ANNULEE: "Annulée",
};

export default function Dashboard({
  creneaux,
  reservations,
}: {
  creneaux: CreneauDto[];
  reservations: ReservationDto[];
}) {
  const router = useRouter();
  const [onglet, setOnglet] = useState<"reservations" | "creneaux" | "saisie">(
    "reservations"
  );
  const [occupe, setOccupe] = useState(false);

  async function appel(url: string, method: string, body: unknown) {
    setOccupe(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Action impossible.");
        return false;
      }
      router.refresh();
      return true;
    } finally {
      setOccupe(false);
    }
  }

  async function deconnexion() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  const enAttente = reservations.filter((r) => r.statut === "EN_ATTENTE").length;
  const confirmees = reservations.filter((r) => r.statut === "CONFIRMEE").length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-marine-700">Espace équipe</h1>
          <p className="text-slate-500">
            {enAttente} en attente · {confirmees} confirmées ·{" "}
            {creneaux.filter((c) => c.actif).length} créneaux à venir
          </p>
        </div>
        <button onClick={deconnexion} className="btn-ghost text-base">
          Se déconnecter
        </button>
      </div>

      <div className="mb-6 flex gap-2 border-b border-slate-200">
        {[
          ["reservations", "Réservations"],
          ["creneaux", "Créneaux"],
          ["saisie", "Saisir une réservation"],
        ].map(([cle, label]) => (
          <button
            key={cle}
            onClick={() => setOnglet(cle as typeof onglet)}
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

      {onglet === "reservations" && (
        <ListeReservations
          reservations={reservations}
          occupe={occupe}
          onStatut={(id, statut) =>
            appel("/api/admin/reservations", "PATCH", { id, statut })
          }
        />
      )}

      {onglet === "creneaux" && (
        <GestionCreneaux
          creneaux={creneaux}
          occupe={occupe}
          onCreer={(body) => appel("/api/admin/creneaux", "POST", body)}
          onToggle={(id, actif) =>
            appel("/api/admin/creneaux", "PATCH", { id, actif })
          }
        />
      )}

      {onglet === "saisie" && (
        <SaisieInterne
          creneaux={creneaux.filter((c) => c.actif && c.placesRestantes > 0)}
          occupe={occupe}
          onCreer={(body) =>
            appel("/api/admin/reservations", "POST", body).then((ok) => {
              if (ok) setOnglet("reservations");
              return ok;
            })
          }
        />
      )}
    </div>
  );
}

function ListeReservations({
  reservations,
  occupe,
  onStatut,
}: {
  reservations: ReservationDto[];
  occupe: boolean;
  onStatut: (id: string, statut: ReservationDto["statut"]) => void;
}) {
  if (reservations.length === 0) {
    return (
      <p className="rounded-xl bg-white p-6 text-slate-500 shadow-sm">
        Aucune réservation pour l&apos;instant.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {reservations.map((r) => (
        <div
          key={r.id}
          className="rounded-xl bg-white p-4 shadow-sm sm:flex sm:items-center sm:justify-between"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-800">
                {r.nomClient}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-xs ${badge[r.statut]}`}>
                {libelleStatut[r.statut]}
              </span>
              {r.source === "INTERNE" && (
                <span className="rounded-full bg-marine-100 px-2 py-0.5 text-xs text-marine-600">
                  Saisie CCAS
                </span>
              )}
            </div>
            <div className="mt-1 text-sm text-slate-600">
              🗓️ <span className="capitalize">{fmtDateHeure(r.creneauDate)}</span>{" "}
              · 👥 {r.nombrePersonnes} · 📞 {r.telephone}
              {r.email ? ` · ✉️ ${r.email}` : ""}
            </div>
            {r.adresse && (
              <div className="text-sm text-slate-500">📍 {r.adresse}</div>
            )}
            {r.besoinsParticuliers && (
              <div className="text-sm text-slate-500">
                📝 {r.besoinsParticuliers}
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-2 sm:mt-0">
            {r.statut !== "CONFIRMEE" && (
              <button
                disabled={occupe}
                onClick={() => onStatut(r.id, "CONFIRMEE")}
                className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                Confirmer
              </button>
            )}
            {r.statut !== "ANNULEE" && (
              <button
                disabled={occupe}
                onClick={() => onStatut(r.id, "ANNULEE")}
                className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-300 disabled:opacity-50"
              >
                Annuler
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function GestionCreneaux({
  creneaux,
  occupe,
  onCreer,
  onToggle,
}: {
  creneaux: CreneauDto[];
  occupe: boolean;
  onCreer: (body: {
    date: string;
    dureeMinutes: number;
    capaciteMax: number;
    lieuDepart: string;
  }) => Promise<boolean>;
  onToggle: (id: string, actif: boolean) => void;
}) {
  const [date, setDate] = useState("");
  const [capacite, setCapacite] = useState(2);
  const [duree, setDuree] = useState(45);
  const [lieu, setLieu] = useState("Devant le CCAS");

  async function ajouter() {
    if (!date) {
      alert("Choisissez une date et une heure.");
      return;
    }
    const ok = await onCreer({
      date: new Date(date).toISOString(),
      dureeMinutes: duree,
      capaciteMax: capacite,
      lieuDepart: lieu,
    });
    if (ok) setDate("");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-marine-700">
          Ajouter un créneau
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label text-sm">Date et heure</label>
            <input
              type="datetime-local"
              className="champ text-base"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label text-sm">Places</label>
            <input
              type="number"
              min={1}
              max={10}
              className="champ text-base"
              value={capacite}
              onChange={(e) => setCapacite(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label text-sm">Durée (min)</label>
            <input
              type="number"
              min={5}
              max={480}
              className="champ text-base"
              value={duree}
              onChange={(e) => setDuree(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label text-sm">Lieu de départ</label>
            <input
              className="champ text-base"
              value={lieu}
              onChange={(e) => setLieu(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={ajouter}
          disabled={occupe}
          className="btn-primary mt-4 text-base"
        >
          Ajouter le créneau
        </button>
      </div>

      <div className="space-y-2">
        {creneaux.length === 0 && (
          <p className="rounded-xl bg-white p-6 text-slate-500 shadow-sm">
            Aucun créneau à venir. Ajoutez-en un ci-dessus.
          </p>
        )}
        {creneaux.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm"
          >
            <div>
              <div className="font-medium capitalize text-slate-800">
                {fmtDateHeure(c.date)}
              </div>
              <div className="text-sm text-slate-500">
                {c.lieuDepart} · {c.placesRestantes}/{c.capaciteMax} place(s)
                libre(s) · {c.dureeMinutes} min
                {!c.actif && " · désactivé"}
              </div>
            </div>
            <button
              disabled={occupe}
              onClick={() => onToggle(c.id, !c.actif)}
              className={`rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50 ${
                c.actif
                  ? "bg-slate-200 text-slate-600 hover:bg-slate-300"
                  : "bg-marine-500 text-white hover:bg-marine-600"
              }`}
            >
              {c.actif ? "Désactiver" : "Réactiver"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SaisieInterne({
  creneaux,
  occupe,
  onCreer,
}: {
  creneaux: CreneauDto[];
  occupe: boolean;
  onCreer: (body: Record<string, unknown>) => Promise<boolean>;
}) {
  const [creneauId, setCreneauId] = useState("");

  async function soumettre(formData: FormData) {
    if (!creneauId) {
      alert("Choisissez un créneau.");
      return;
    }
    const ok = await onCreer({
      creneauId,
      nomClient: formData.get("nomClient"),
      telephone: formData.get("telephone"),
      email: formData.get("email"),
      adresse: formData.get("adresse"),
      nombrePersonnes: Number(formData.get("nombrePersonnes") || 1),
      besoinsParticuliers: formData.get("besoinsParticuliers"),
    });
    if (ok) setCreneauId("");
  }

  return (
    <form
      action={soumettre}
      className="max-w-lg space-y-4 rounded-xl bg-white p-6 shadow-sm"
    >
      <p className="text-sm text-slate-500">
        Enregistrez une réservation par téléphone ou au guichet. Elle sera
        directement marquée « confirmée ».
      </p>
      <div>
        <label className="label">Créneau *</label>
        <select
          className="champ"
          value={creneauId}
          onChange={(e) => setCreneauId(e.target.value)}
          required
        >
          <option value="">— Choisir —</option>
          {creneaux.map((c) => (
            <option key={c.id} value={c.id}>
              {fmtDateHeure(c.date)} ({c.placesRestantes} place
              {c.placesRestantes > 1 ? "s" : ""})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Nom et prénom *</label>
        <input name="nomClient" required className="champ" />
      </div>
      <div>
        <label className="label">Téléphone *</label>
        <input name="telephone" required type="tel" className="champ" />
      </div>
      <div>
        <label className="label">Email (facultatif)</label>
        <input name="email" type="email" className="champ" />
      </div>
      <div>
        <label className="label">Adresse (facultatif)</label>
        <input name="adresse" className="champ" />
      </div>
      <div>
        <label className="label">Nombre de personnes</label>
        <input
          name="nombrePersonnes"
          type="number"
          min={1}
          max={10}
          defaultValue={1}
          className="champ"
        />
      </div>
      <div>
        <label className="label">Besoins particuliers (facultatif)</label>
        <textarea name="besoinsParticuliers" rows={2} className="champ" />
      </div>
      <button type="submit" disabled={occupe} className="btn-primary w-full">
        Enregistrer la réservation
      </button>
    </form>
  );
}
