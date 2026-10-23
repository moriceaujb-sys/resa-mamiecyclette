import { estConnecte } from "@/lib/auth";
import { benevolesListe } from "@/lib/pedaleurs";
import Telephone from "@/app/telephone";

export const dynamic = "force-dynamic";

function dateFr(iso: string | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

// Listing des pédaleurs bénévoles (informations pour l'assurance du CCAS).
export default async function BenevolesPage() {
  if (!estConnecte()) return null;
  const benevoles = await benevolesListe();
  const incomplets = benevoles.filter(
    (b) => !b.telephone || !b.dateNaissance || !b.adresse
  ).length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-marine-700">
          Bénévoles{" "}
          <span className="text-base font-normal text-slate-600">
            ({benevoles.length})
          </span>
        </h1>
        <a href="/api/admin/benevoles" className="btn-primary text-base">
          Télécharger la liste (Excel)
        </a>
      </div>
      <p className="mb-4 text-slate-600">
        Informations demandées aux pédaleurs pour l&apos;assurance du CCAS.
        {incomplets > 0 &&
          ` ${incomplets} fiche${incomplets > 1 ? "s" : ""} à compléter : les informations manquantes seront demandées au bénévole à sa prochaine connexion.`}
      </p>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Nom et prénom</th>
              <th className="px-4 py-3 font-semibold">Date de naissance</th>
              <th className="px-4 py-3 font-semibold">Adresse postale</th>
              <th className="px-4 py-3 font-semibold">Téléphone</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Balades</th>
            </tr>
          </thead>
          <tbody>
            {benevoles.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-slate-600">
                  Aucun pédaleur inscrit pour l&apos;instant.
                </td>
              </tr>
            )}
            {benevoles.map((b) => (
              <tr key={b.id} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-3 font-medium text-slate-800">{b.nom}</td>
                <td className="px-4 py-3 text-slate-600">
                  {b.dateNaissance ? dateFr(b.dateNaissance) : <Manquant />}
                </td>
                <td className="px-4 py-3 text-slate-600">{b.adresse || <Manquant />}</td>
                <td className="px-4 py-3 text-slate-600">{b.telephone ? <Telephone numero={b.telephone} /> : <Manquant />}</td>
                <td className="px-4 py-3 text-slate-600">{b.email}</td>
                <td className="px-4 py-3 text-slate-600">{b.nbBalades}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Manquant() {
  return <span className="text-bordeaux-500">À compléter</span>;
}
