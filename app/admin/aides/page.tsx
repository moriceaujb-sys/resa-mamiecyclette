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
          <strong>1 pédaleur</strong> (bénévole). L&apos;équipe enregistre les
          disponibilités des bénéficiaires depuis la page Réservation (un ou
          plusieurs créneaux). Les pédaleurs, connectés à leur compte, prennent
          en charge les créneaux. Une <strong>structure</strong> (EHPAD,
          association…) peut aussi réserver un créneau entier avec son propre
          pédaleur (voir plus bas).
        </p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-lg font-bold text-marine-700">
          Les statuts d&apos;un créneau
        </h2>
        <ul className="space-y-2 text-slate-700">
          <li>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              Dispo (0/2)
            </span>{" "}
            — aucun bénéficiaire.
          </li>
          <li>
            <span className="rounded-full bg-soleil-400/25 px-2 py-0.5 text-xs font-medium text-marine-700">
              Cherche sa moitié (1/2)
            </span>{" "}
            — 1 bénéficiaire ; visible par les pédaleurs, qui peuvent déjà
            prendre le créneau.
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
            qu&apos;un bénéficiaire ; un 2e passager peut encore rejoindre la
            balade, <strong>jusqu&apos;à 48 h avant</strong> le départ (au-delà, le
            créneau n&apos;est plus proposé : pas d&apos;ajout de dernière minute
            pour le pédaleur).
          </li>
          <li>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              Complet avec pédaleur (3/3)
            </span>{" "}
            — 2 bénéficiaires + 1 pédaleur, la balade est bouclée.
          </li>
          <li>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              Complet pour une structure
            </span>{" "}
            — le créneau entier est réservé par une structure (EHPAD,
            association…) qui vient avec son propre pédaleur. Il n&apos;est plus
            proposé ni aux bénéficiaires ni aux pédaleurs bénévoles.
          </li>
        </ul>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-bold text-marine-700">
          Réserver pour une structure
        </h2>
        <p className="text-slate-700">
          Dans la page <strong>Réservation</strong>, un sélecteur permet de
          choisir entre <strong>un bénéficiaire</strong> et{" "}
          <strong>une structure</strong>. Pour une structure, on renseigne le
          nom de la structure, le téléphone, l&apos;email, l&apos;adresse postale
          et le <strong>nombre estimé de bénéficiaires promenés</strong> (tous
          obligatoires), ainsi que d&apos;éventuels besoins particuliers.
        </p>
        <p className="mt-2 text-slate-700">
          Une structure prend le créneau <strong>entier</strong> : seuls les
          créneaux encore totalement libres (aucun bénéficiaire, aucun pédaleur)
          lui sont proposés. Chaque créneau sélectionné est réservé{" "}
          <strong>fermement</strong> (pas de règle de libération : une structure
          peut réserver plusieurs sorties). La structure apparaît dans la liste
          des <strong>Bénéficiaires</strong> avec la mention « Structure », et sa
          fiche permet de modifier ses informations ou de retirer un créneau.
        </p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-bold text-marine-700">
          Gérer les créneaux
        </h2>
        <p className="text-slate-700">
          Les créneaux se génèrent <strong>automatiquement</strong> (lundi,
          mercredi, vendredi à 10h, 11h15, 15h et 16h, sur les mois à venir). Dans
          la page <strong>Créneaux</strong>, vous pouvez en plus{" "}
          <strong>ajouter</strong> un créneau exceptionnel, <strong>modifier</strong>{" "}
          (date, heure, durée, lieu), <strong>désactiver</strong> ou{" "}
          <strong>supprimer</strong>. Vos modifications ne sont jamais réécrasées
          par la génération automatique.
        </p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-bold text-marine-700">
          Règles pour les pédaleurs
        </h2>
        <p className="text-slate-700">
          Un pédaleur peut prendre un créneau dès qu&apos;il y a{" "}
          <strong>1 bénéficiaire</strong> en attente. Un second bénéficiaire peut
          ensuite se rajouter à la balade prévue, mais seulement si elle a lieu
          dans <strong>plus de 48 heures</strong> ; à moins de 48 h, le créneau
          n&apos;est plus proposé à la réservation.
        </p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-bold text-marine-700">
          Tableau de bord de pilotage
        </h2>
        <p className="text-slate-700">
          La page <strong>Tableau de bord de pilotage</strong> donne les chiffres
          du jour : pédaleurs inscrits et actifs, bénéficiaires enregistrés (dont
          ceux qui ont déjà fait une balade ou en attendent une), structures, et
          créneaux de balade. Une <strong>balade prise</strong> est un créneau qui
          a un pédaleur bénévole ou qui est réservé par une structure. Les
          balades sont comptées « réalisées » une fois la date passée ; les
          passagers promenés sont les bénéficiaires confirmés (pour une
          structure, le nombre estimé indiqué à la réservation). Le tableau
          « Balades par mois » récapitule les balades prises, y compris celles à
          venir.
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
