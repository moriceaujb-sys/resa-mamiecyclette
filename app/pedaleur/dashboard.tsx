"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CreneauPedaleur, BaladePedaleur } from "@/lib/creneaux";
import { LIEU_TRIPORTEUR } from "@/lib/horaires";
import { Charte, Contacts } from "@/app/infos-pedaleur";

type Profil = {
  complet: boolean;
  telephone: string;
  dateNaissance: string;
  adresse: string;
};

function fmt(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

// Moins de 48 h avant le départ : on demande aussi de prévenir l'équipe.
function departProche(iso: string): boolean {
  return new Date(iso).getTime() - Date.now() < 48 * 3600 * 1000;
}

export default function Dashboard({
  nom,
  aConfirmer,
  mesBalades,
  profil,
}: {
  nom: string;
  aConfirmer: CreneauPedaleur[];
  mesBalades: BaladePedaleur[];
  profil: Profil;
}) {
  const router = useRouter();
  const [occupe, setOccupe] = useState(false);
  const [editionProfil, setEditionProfil] = useState(false);
  const [erreurProfil, setErreurProfil] = useState<string | null>(null);
  const nbNouveaux = aConfirmer.filter((c) => c.nouveau).length;

  async function deconnexion() {
    await fetch("/api/pedaleur/deconnexion", { method: "POST" });
    router.refresh();
  }

  async function action(url: string, creneauId: string) {
    setOccupe(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creneauId }),
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

  function retirer(b: BaladePedaleur) {
    const message = departProche(b.date)
      ? "Vous retirer de cette balade ? Elle a lieu dans moins de 48 h : merci de prévenir aussi l'équipe du CCAS par téléphone."
      : "Vous retirer de cette balade ? Elle sera de nouveau proposée aux autres pédaleurs.";
    if (confirm(message)) action("/api/pedaleur/retirer", b.id);
  }

  async function enregistrerProfil(formData: FormData) {
    setOccupe(true);
    setErreurProfil(null);
    try {
      const res = await fetch("/api/pedaleur/profil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telephone: formData.get("telephone"),
          dateNaissance: formData.get("dateNaissance"),
          adresse: formData.get("adresse"),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErreurProfil(d.error || "Une erreur est survenue.");
        return;
      }
      setEditionProfil(false);
      router.refresh();
    } finally {
      setOccupe(false);
    }
  }

  const formulaireProfil = (
    <form action={enregistrerProfil} className="mt-4 grid gap-4 sm:grid-cols-2">
      <div>
        <label className="label" htmlFor="telephone">
          Téléphone
        </label>
        <input
          id="telephone"
          name="telephone"
          type="tel"
          required
          defaultValue={profil.telephone}
          className="champ"
          autoComplete="tel"
        />
      </div>
      <div>
        <label className="label" htmlFor="dateNaissance">
          Date de naissance
        </label>
        <input
          id="dateNaissance"
          name="dateNaissance"
          type="date"
          required
          defaultValue={profil.dateNaissance}
          className="champ"
          autoComplete="bday"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="adresse">
          Adresse postale
        </label>
        <input
          id="adresse"
          name="adresse"
          required
          defaultValue={profil.adresse}
          className="champ"
          autoComplete="street-address"
        />
      </div>
      {erreurProfil && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-red-700 sm:col-span-2">
          {erreurProfil}
        </p>
      )}
      <div className="sm:col-span-2">
        <button type="submit" disabled={occupe} className="btn-primary">
          Enregistrer mes informations
        </button>
      </div>
    </form>
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-marine-700">Bonjour {nom} 👋</h1>
          <p className="text-slate-600">Merci de faire pédaler la solidarité !</p>
        </div>
        <button onClick={deconnexion} className="btn-ghost text-base">
          Se déconnecter
        </button>
      </div>

      {!profil.complet && (
        <section className="mb-6 rounded-xl border-2 border-soleil-400 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-marine-700">
            Merci de compléter vos informations
          </h2>
          <p className="mt-1 text-slate-700">
            Ces informations sont demandées pour l&apos;
            <strong>assurance du CCAS</strong>, qui couvre les pédaleurs pendant
            les balades.
          </p>
          {formulaireProfil}
        </section>
      )}

      {nbNouveaux > 0 && (
        <a
          href="#a-confirmer"
          className="mb-6 flex items-center gap-3 rounded-xl bg-soleil-400 px-5 py-4 font-semibold text-marine-700 shadow-sm hover:bg-soleil-500"
        >
          <span className="text-2xl" aria-hidden="true">
            🔔
          </span>
          {nbNouveaux === 1
            ? "Il y a 1 nouvelle balade depuis votre dernière visite, allez voir !"
            : `Il y a ${nbNouveaux} nouvelles balades depuis votre dernière visite, allez voir !`}
        </a>
      )}

      <p className="mb-6 rounded-xl bg-white p-4 text-slate-700 shadow-sm">
        🚲 Le triporteur est à récupérer à l&apos;<strong>{LIEU_TRIPORTEUR}</strong>.
        La balade part du <strong>domicile de la personne</strong> : son adresse
        s&apos;affiche dans « Mes balades » une fois le créneau confirmé.
      </p>

      <section id="a-confirmer" className="mb-8 scroll-mt-4">
        <h2 className="mb-1 text-xl font-bold text-marine-700">
          Balades à confirmer
        </h2>
        <p className="mb-4 text-sm text-slate-600">
          Ces créneaux ont au moins 1 bénéficiaire prêt — il ne manque que vous.
          Un 2e passager peut encore rejoindre la balade jusqu&apos;à 48 h avant.
        </p>
        {aConfirmer.length === 0 ? (
          <p className="rounded-xl bg-white p-6 text-slate-600 shadow-sm">
            Aucun créneau à confirmer pour l&apos;instant. Revenez plus tard : dès
            qu&apos;un bénéficiaire se positionne sur un créneau, il apparaît ici.
          </p>
        ) : (
          <div className="space-y-3">
            {aConfirmer.map((c) => (
              <div
                key={c.id}
                className={`rounded-xl bg-white p-4 shadow-sm sm:flex sm:items-center sm:justify-between ${
                  c.nouveau ? "ring-2 ring-soleil-400" : ""
                }`}
              >
                <div>
                  <div className="font-semibold capitalize text-slate-800">
                    {c.nouveau && (
                      <span className="mr-2 rounded-full bg-soleil-400 px-2 py-0.5 text-xs font-bold normal-case text-marine-700">
                        Nouveau
                      </span>
                    )}
                    {fmt(c.date)}
                  </div>
                  <div className="text-sm text-slate-600">
                    📍 {c.lieuDepart} · 👥 {c.nbBeneficiaires} bénéficiaire{c.nbBeneficiaires > 1 ? "s" : ""} · ⏱️{" "}
                    {c.dureeMinutes} min
                  </div>
                </div>
                <button
                  disabled={occupe}
                  onClick={() => action("/api/pedaleur/confirmer", c.id)}
                  className="btn-soleil mt-3 sm:mt-0"
                >
                  Je pédale ce créneau
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-bold text-marine-700">Mes balades</h2>
        {mesBalades.length === 0 ? (
          <p className="rounded-xl bg-white p-6 text-slate-600 shadow-sm">
            Vous n&apos;avez pas encore confirmé de balade.
          </p>
        ) : (
          <div className="space-y-3">
            {mesBalades.map((b) => (
              <div key={b.id} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold capitalize text-slate-800">
                      {fmt(b.date)}
                    </div>
                    <div className="text-sm text-slate-600">📍 {b.lieuDepart}</div>
                  </div>
                  {b.aVenir && (
                    <button
                      disabled={occupe}
                      onClick={() => retirer(b)}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-200 hover:bg-red-50 disabled:opacity-50"
                    >
                      Me retirer de cette balade
                    </button>
                  )}
                </div>
                <div className="mt-2 space-y-1">
                  {b.beneficiaires.map((p, i) => (
                    <div key={i} className="text-sm text-slate-600">
                      {p.couple ? "👫" : "🧓"} {p.nom}
                      {p.couple ? " (couple)" : ""} · 📞 {p.telephone}
                      {p.adresse ? ` · 🏠 ${p.adresse}` : ""}
                    </div>
                  ))}
                </div>
                {b.nbPassagers < 2 && (
                  <div className="mt-1 text-sm font-medium text-marine-600">
                    En attente d&apos;un 2e passager…
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <details className="group mb-3 rounded-xl bg-white p-5 shadow-sm">
        <summary className="cursor-pointer list-none text-lg font-bold text-marine-700">
          <span className="mr-2 inline-block transition group-open:rotate-90">›</span>
          📞 Contacts utiles (planning, triporteur, dépannage, urgences)
        </summary>
        <div className="mt-4">
          <Contacts />
        </div>
      </details>

      <details className="group mb-8 rounded-xl bg-white p-5 shadow-sm">
        <summary className="cursor-pointer list-none text-lg font-bold text-marine-700">
          <span className="mr-2 inline-block transition group-open:rotate-90">›</span>
          📜 Charte du pédaleur
        </summary>
        <div className="mt-4">
          <Charte />
        </div>
      </details>

      {profil.complet && (
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-marine-700">Mes informations</h2>
            <button
              onClick={() => setEditionProfil((v) => !v)}
              className="text-sm font-medium text-marine-600 hover:underline"
            >
              {editionProfil ? "Fermer" : "Modifier"}
            </button>
          </div>
          {editionProfil ? (
            formulaireProfil
          ) : (
            <p className="mt-2 text-sm text-slate-600">
              📞 {profil.telephone} · 🏠 {profil.adresse}
            </p>
          )}
          <p className="mt-3 text-xs text-slate-600">
            Ces informations sont transmises à l&apos;assurance du CCAS.
          </p>
        </section>
      )}
    </div>
  );
}
