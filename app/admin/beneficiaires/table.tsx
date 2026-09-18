"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { BeneficiaireListe } from "@/lib/beneficiaires";

export default function BeneficiairesTable({
  beneficiaires,
}: {
  beneficiaires: BeneficiaireListe[];
}) {
  const router = useRouter();
  const [q, setQ] = useState("");

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
        b.type === "STRUCTURE" ? "structure" : "bénéficiaire",
      ]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(t))
    );
  }, [q, beneficiaires]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-marine-700">
          Bénéficiaires{" "}
          <span className="text-base font-normal text-slate-600">
            ({beneficiaires.length})
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
            {filtres.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-600">
                  Aucun bénéficiaire trouvé.
                </td>
              </tr>
            )}
            {filtres.map((b) => (
              <tr
                key={b.id}
                onClick={() => router.push(`/admin/beneficiaires/${b.id}`)}
                className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-marine-50"
              >
                <td className="px-4 py-3 font-medium text-slate-800">
                  {b.type === "STRUCTURE" ? "🏢 " : ""}
                  {b.nom}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {b.type === "STRUCTURE" ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Structure
                      {b.nbBeneficiairesEstime != null ? ` · ~${b.nbBeneficiairesEstime} pers.` : ""}
                    </span>
                  ) : (
                    "Bénéficiaire"
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{b.telephone}</td>
                <td className="px-4 py-3 text-slate-600">{b.email || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{b.adresse || "—"}</td>
                <td className="px-4 py-3 text-slate-600">
                  {b.besoinsParticuliers || "—"}
                </td>
                <td className="px-4 py-3 text-center text-slate-600">
                  {b.nbCreneaux}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-slate-600">
        Cliquez sur une ligne pour ouvrir la fiche du bénéficiaire.
      </p>
    </div>
  );
}
