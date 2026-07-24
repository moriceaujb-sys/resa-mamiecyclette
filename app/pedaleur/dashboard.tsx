"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CreneauPedaleur = {
  id: string;
  date: string;
  dureeMinutes: number;
  lieuDepart: string;
  nbBeneficiaires: number;
};

type Balade = {
  id: string;
  date: string;
  lieuDepart: string;
  beneficiaires: { nom: string; telephone: string }[];
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

export default function Dashboard({
  nom,
  aConfirmer,
  mesBalades,
}: {
  nom: string;
  aConfirmer: CreneauPedaleur[];
  mesBalades: Balade[];
}) {
  const router = useRouter();
  const [occupe, setOccupe] = useState(false);

  async function deconnexion() {
    await fetch("/api/pedaleur/deconnexion", { method: "POST" });
    router.refresh();
  }

  async function confirmer(id: string) {
    setOccupe(true);
    try {
      const res = await fetch("/api/pedaleur/confirmer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creneauId: id }),
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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-marine-700">Bonjour {nom} 👋</h1>
          <p className="text-slate-500">Merci de faire pédaler la solidarité !</p>
        </div>
        <button onClick={deconnexion} className="btn-ghost text-base">
          Se déconnecter
        </button>
      </div>

      <section className="mb-8">
        <h2 className="mb-1 text-xl font-bold text-marine-700">
          Balades à confirmer
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          Ces créneaux ont déjà 2 bénéficiaires prêts — il ne manque que vous.
        </p>
        {aConfirmer.length === 0 ? (
          <p className="rounded-xl bg-white p-6 text-slate-500 shadow-sm">
            Aucun créneau à confirmer pour l&apos;instant. Revenez plus tard : dès
            que 2 bénéficiaires se positionnent sur un même créneau, il apparaît
            ici.
          </p>
        ) : (
          <div className="space-y-3">
            {aConfirmer.map((c) => (
              <div
                key={c.id}
                className="rounded-xl bg-white p-4 shadow-sm sm:flex sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-semibold capitalize text-slate-800">
                    {fmt(c.date)}
                  </div>
                  <div className="text-sm text-slate-500">
                    📍 {c.lieuDepart} · 👥 2 bénéficiaires prêts · ⏱️{" "}
                    {c.dureeMinutes} min
                  </div>
                </div>
                <button
                  disabled={occupe}
                  onClick={() => confirmer(c.id)}
                  className="btn-soleil mt-3 sm:mt-0"
                >
                  Je pédale ce créneau
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-marine-700">Mes balades</h2>
        {mesBalades.length === 0 ? (
          <p className="rounded-xl bg-white p-6 text-slate-500 shadow-sm">
            Vous n&apos;avez pas encore confirmé de balade.
          </p>
        ) : (
          <div className="space-y-3">
            {mesBalades.map((b) => (
              <div key={b.id} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="font-semibold capitalize text-slate-800">
                  {fmt(b.date)}
                </div>
                <div className="text-sm text-slate-500">📍 {b.lieuDepart}</div>
                <div className="mt-2 space-y-1">
                  {b.beneficiaires.map((p, i) => (
                    <div key={i} className="text-sm text-slate-600">
                      🧓 {p.nom} · 📞 {p.telephone}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
