"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { BeneficiaireListe } from "@/lib/beneficiaires";
import Telephone from "@/app/telephone";
import { cleDoublon } from "@/lib/doublons";

function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

// Première valeur renseignée parmi les fiches (la plus récente d'abord).
function premiere<K extends keyof BeneficiaireListe>(
  fiches: BeneficiaireListe[],
  k: K
): BeneficiaireListe[K] | null {
  for (const f of fiches) if (f[k]) return f[k];
  return null;
}

export default function BeneficiairesTable({
  beneficiaires,
}: {
  beneficiaires: BeneficiaireListe[];
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [ouverts, setOuverts] = useState<Set<string>>(new Set());

  const filtres = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return beneficiaires;
    return beneficiaires.filter((b) =>
      [
        b.nom,
        b.telephone,
        b.email,
        b.adresse,
        b.besoinsParticuliers,
        b.type === "STRUCTURE" ? "structure" : b.couple ? "couple" : "bénéficiaire",
      ]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(t))
    );
  }, [q, beneficiaires]);

  // Regroupement des fiches d'une même personne (ordre : la plus récente d'abord).
  const groupes = useMemo(() => {
    const m = new Map<string, BeneficiaireListe[]>();
    for (const b of filtres) {
      const k = cleDoublon(b);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(b);
    }
    return Array.from(m.entries()).map(([cle, fiches]) => ({ cle, fiches }));
  }, [filtres]);

  const nbPersonnes = useMemo(
    () => new Set(beneficiaires.map(cleDoublon)).size,
    [beneficiaires]
  );

  function basculer(cle: string) {
    setOuverts((prev) => {
      const n = new Set(prev);
      if (n.has(cle)) n.delete(cle);
      else n.add(cle);
      return n;
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-marine-700">
          Bénéficiaires{" "}
          <span className="text-base font-normal text-slate-600">
            ({nbPersonnes}
            {nbPersonnes !== beneficiaires.length
              ? ` personnes · ${beneficiaires.length} fiches`
              : ""}
            )
          </span>
        </h1>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher (nom, téléphone, email, adresse…)"
          className="champ max-w-xs text-base"
        />
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 text-xs uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Adresse</th>
              <th className="px-4 py-3">Besoins particuliers</th>
              <th className="px-4 py-3 text-center">Créneaux</th>
            </tr>
          </thead>
          <tbody>
            {groupes.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-600">
                  Aucun bénéficiaire trouvé.
                </td>
              </tr>
            )}
            {groupes.map(({ cle, fiches }) => {
              const b = fiches[0];
              const plusieurs = fiches.length > 1;
              const ouvert = ouverts.has(cle);
              const email = premiere(fiches, "email");
              const adresse = premiere(fiches, "adresse");
              const besoins = premiere(fiches, "besoinsParticuliers");
              const nbCreneaux = fiches.reduce((n, f) => n + f.nbCreneaux, 0);
              return (
                <Fragment key={cle}>
                  <tr
                    onClick={() =>
                      plusieurs ? basculer(cle) : router.push(`/admin/beneficiaires/${b.id}`)
                    }
                    className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-marine-50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {b.type === "STRUCTURE" ? "🏢 " : ""}
                      {b.nom}
                      {plusieurs && (
                        <span className="ml-2 whitespace-nowrap rounded-full bg-marine-100 px-2 py-0.5 text-xs font-medium text-marine-700">
                          {ouvert ? "▾" : "▸"} {fiches.length} fiches
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {b.type === "STRUCTURE" ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          Structure
                          {b.nbBeneficiairesEstime != null ? ` · ~${b.nbBeneficiairesEstime} pers.` : ""}
                        </span>
                      ) : b.couple ? (
                        "👫 Couple (2 places)"
                      ) : (
                        "Bénéficiaire"
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <Telephone numero={b.telephone} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{email || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{adresse || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{besoins || "—"}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{nbCreneaux}</td>
                  </tr>
                  {plusieurs &&
                    ouvert &&
                    fiches.map((f) => (
                      <tr
                        key={f.id}
                        onClick={() => router.push(`/admin/beneficiaires/${f.id}`)}
                        className="cursor-pointer border-b border-slate-50 bg-slate-50 hover:bg-marine-50"
                      >
                        <td className="py-2 pl-8 pr-4 text-marine-600 underline" colSpan={2}>
                          Fiche du {fmtDate(f.createdAt)}
                        </td>
                        <td className="px-4 py-2 text-slate-600">{f.telephone}</td>
                        <td className="px-4 py-2 text-slate-600">{f.email || "—"}</td>
                        <td className="px-4 py-2 text-slate-600">{f.adresse || "—"}</td>
                        <td className="px-4 py-2 text-slate-600">
                          {f.besoinsParticuliers || "—"}
                        </td>
                        <td className="px-4 py-2 text-center text-slate-600">{f.nbCreneaux}</td>
                      </tr>
                    ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-slate-600">
        Cliquez sur une ligne pour ouvrir la fiche du bénéficiaire. Les fiches
        d&apos;une même personne (même nom et même téléphone) sont regroupées :
        cliquez sur la ligne pour les afficher, puis sur une fiche pour
        l&apos;ouvrir.
      </p>
    </div>
  );
}
