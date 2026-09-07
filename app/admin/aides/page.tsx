export const dynamic = "force-dynamic";

export default function AidePage() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-marine-700">Aide &amp; documentation</h1>

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
          Gérer les créneaux
        </h2>
        <p className="text-slate-700">
          Les créneaux se génèrent <strong>automatiquement</strong> (lundi,
          mercredi, vendredi à 10h, 11h, 15h et 16h, sur les mois à venir). Dans
          la page <strong>Créneaux</strong>, vous pouvez en plus{" "}
          <strong>ajouter</strong> un créneau exceptionnel, <strong>modifier</strong>{" "}
          (date, heure, durée, lieu), <strong>désactiver</strong> ou{" "}
          <strong>supprimer</strong>. Vos modifications ne sont jamais réécrasées
          par la génération automatique.
        </p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-bold text-marine-700">
          La règle de libération
        </h2>
        <p className="text-slate-700">
          Quand un pédaleur confirme un créneau, <strong>seuls les bénéficiaires
          de ce créneau</strong> voient leurs <em>autres</em> disponibilités
          libérées. Les autres bénéficiaires conservent l&apos;intégralité de
          leurs créneaux.
        </p>
      </div>
    </div>
  );
}
