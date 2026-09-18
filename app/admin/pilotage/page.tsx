import { estConnecte } from "@/lib/auth";
import { ensureCreneaux } from "@/lib/creneaux";
import { indicateursPilotage } from "@/lib/pilotage";

export const dynamic = "force-dynamic";

function Tuile({
  libelle,
  valeur,
  detail,
}: {
  libelle: string;
  valeur: number;
  detail?: string;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="text-sm text-slate-600">{libelle}</div>
      <div className="mt-1 text-4xl font-semibold text-marine-700">
        {valeur.toLocaleString("fr-FR")}
      </div>
      {detail && <div className="mt-1 text-sm text-slate-500">{detail}</div>}
    </div>
  );
}

export default async function PilotagePage() {
  if (!estConnecte()) return null;
  await ensureCreneaux();
  const i = await indicateursPilotage();
  const dateCalcul = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(i.calculeLe));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-marine-700">Tableau de bord de pilotage</h1>
        <p className="mt-1 text-sm text-slate-600">Chiffres au {dateCalcul}.</p>
      </div>

      <section aria-labelledby="kpi-pedaleurs">
        <h2 id="kpi-pedaleurs" className="mb-3 text-lg font-bold text-marine-700">
          Pédaleurs
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Tuile libelle="Pédaleurs inscrits" valeur={i.pedaleurs.inscrits} />
          <Tuile
            libelle="Pédaleurs actifs"
            valeur={i.pedaleurs.actifs}
            detail="Ont pris au moins une balade"
          />
          <Tuile libelle="Nouveaux inscrits ce mois-ci" valeur={i.pedaleurs.nouveauxCeMois} />
        </div>
      </section>

      <section aria-labelledby="kpi-beneficiaires">
        <h2 id="kpi-beneficiaires" className="mb-3 text-lg font-bold text-marine-700">
          Bénéficiaires
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tuile libelle="Bénéficiaires enregistrés" valeur={i.beneficiaires.personnes} />
          <Tuile
            libelle="Ont fait au moins une balade"
            valeur={i.beneficiaires.personnesAvecBalade}
            detail="Balade confirmée par un pédaleur"
          />
          <Tuile
            libelle="En attente d'une balade"
            valeur={i.beneficiaires.personnesEnAttente}
            detail="Disponibilités sur des créneaux à venir"
          />
          <Tuile libelle="Structures" valeur={i.beneficiaires.structures} detail="EHPAD, associations…" />
        </div>
      </section>

      <section aria-labelledby="kpi-balades">
        <h2 id="kpi-balades" className="mb-3 text-lg font-bold text-marine-700">
          Créneaux de balade
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Tuile
            libelle="Balades à venir"
            valeur={i.balades.aVenir}
            detail="Créneaux pris (pédaleur bénévole ou structure)"
          />
          <Tuile
            libelle="Balades réalisées"
            valeur={i.balades.realisees}
            detail="Créneaux pris, déjà passés"
          />
          <Tuile
            libelle="Passagers promenés"
            valeur={i.balades.passagersPromenes}
            detail="Sur les balades réalisées"
          />
          <Tuile
            libelle="En attente d'un pédaleur"
            valeur={i.balades.enAttentePedaleur}
            detail="Créneaux à venir avec des bénéficiaires"
          />
          <Tuile
            libelle="Créneaux libres à venir"
            valeur={i.balades.libresAVenir}
            detail="Ni bénéficiaire, ni pédaleur"
          />
          <Tuile
            libelle="Demandes non pourvues"
            valeur={i.balades.nonPourvues}
            detail="Créneaux passés sans pédaleur trouvé"
          />
        </div>
      </section>

      <section aria-labelledby="titre-mois" className="rounded-xl bg-white p-6 shadow-sm">
        <h2 id="titre-mois" className="text-lg font-bold text-marine-700">
          Balades par mois
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Créneaux pris, mois par mois. Les mois à venir sont indiqués en italique.
        </p>
        {i.parMois.length === 0 ? (
          <p className="mt-4 text-slate-600">Aucune balade prise pour l&apos;instant.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-slate-700">
              <thead>
                <tr className="border-b border-slate-200 text-sm text-slate-600">
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Mois
                  </th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">
                    Pédaleurs bénévoles
                  </th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">
                    Structures
                  </th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">
                    Total balades
                  </th>
                  <th scope="col" className="py-2 text-right font-medium">
                    Passagers
                  </th>
                </tr>
              </thead>
              <tbody>
                {i.parMois.map((m) => (
                  <tr
                    key={m.cle}
                    className={`border-b border-slate-100 ${m.aVenir ? "italic text-slate-500" : ""}`}
                  >
                    <th scope="row" className="py-2 pr-4 font-medium">
                      {m.libelle}
                    </th>
                    <td className="py-2 pr-4 text-right tabular-nums">{m.benevoles}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{m.structures}</td>
                    <td className="py-2 pr-4 text-right font-semibold tabular-nums">
                      {m.benevoles + m.structures}
                    </td>
                    <td className="py-2 text-right tabular-nums">{m.passagers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
