import { Charte, Contacts } from "@/app/infos-pedaleur";

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
        <p className="mt-2 text-slate-700">
          La balade part du <strong>domicile de la personne</strong> : son
          adresse est donc obligatoire à la réservation. Le pédaleur récupère le
          triporteur à l&apos;<strong>Espace Robert Robin</strong> et voit
          l&apos;adresse et le téléphone des passagers dans son espace dès
          qu&apos;il a confirmé la balade.
        </p>
        <p className="mt-2 text-slate-700">
          <strong>Un couple</strong> : dans la page Réservation, cochez « C&apos;est
          un couple ». Le couple occupe les <strong>2 places</strong> du
          triporteur : seuls les créneaux encore libres sont proposés, et le
          créneau est complet dès l&apos;enregistrement (il n&apos;attend plus
          qu&apos;un pédaleur).
        </p>
        <p className="mt-2 text-slate-700">
          <strong>Pas de doublon</strong> : si vous enregistrez une personne déjà
          connue (même nom et même téléphone, même si l&apos;écriture diffère
          un peu : accents, espaces, +33), les créneaux sont ajoutés à sa fiche
          existante au lieu d&apos;en créer une nouvelle ; l&apos;email,
          l&apos;adresse et les besoins saisis complètent la fiche. Une personne
          seule et un couple restent des fiches séparées. Dans la page{" "}
          <strong>Bénéficiaires</strong>, les anciennes fiches en double sont
          regroupées sur une même ligne.
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
          Les créneaux se génèrent <strong>automatiquement</strong> le lundi, le
          mercredi et le vendredi, sur les mois à venir :
        </p>
        <ul className="my-2 list-disc space-y-1 pl-6 text-slate-700">
          <li>
            <strong>à l&apos;heure d&apos;été</strong> (du dernier dimanche de
            mars au dernier dimanche d&apos;octobre) : 10h, 11h15, 15h et 16h ;
          </li>
          <li>
            <strong>à l&apos;heure d&apos;hiver</strong> (du dernier dimanche
            d&apos;octobre au dernier dimanche de mars) : 10h, 11h15, 14h30 et
            15h45.
          </li>
        </ul>
        <p className="text-slate-700">
          Chaque balade dure 1 heure. Dans
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
        <p className="mt-2 text-slate-700">
          <strong>Se retirer d&apos;une balade</strong> : dans « Mes balades »,
          le pédaleur peut cliquer sur « Me retirer de cette balade ». Rien
          n&apos;est supprimé : les bénéficiaires restent inscrits sur le créneau
          (ils repassent « en attente ») et la balade est de nouveau proposée
          aux autres pédaleurs. À moins de 48 h du départ, il lui est demandé de
          prévenir aussi l&apos;équipe par téléphone. L&apos;équipe peut faire
          la même chose depuis la page <strong>Créneaux</strong> (Détails →
          « Retirer le pédaleur »). Le numéro du pédaleur est affiché sur chaque
          créneau qu&apos;il a pris.
        </p>
        <p className="mt-2 text-slate-700">
          <strong>Nouvelles balades</strong> : quand un pédaleur se connecte, les
          balades apparues depuis sa dernière visite sont signalées par un
          bandeau « Il y a de nouvelles balades, allez voir ! » et une pastille
          « Nouveau ».
        </p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-bold text-marine-700">
          Charte du pédaleur
        </h2>
        <Charte />
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-lg font-bold text-marine-700">
          Contacts utiles au pédaleur
        </h2>
        <Contacts />
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-bold text-marine-700">
          Bénévoles et assurance
        </h2>
        <p className="text-slate-700">
          À l&apos;inscription, chaque pédaleur indique son nom et prénom, sa
          date de naissance, son adresse postale, son téléphone et son email :
          ces informations sont demandées pour l&apos;
          <strong>assurance du CCAS</strong>. Les pédaleurs inscrits avant cette
          règle les voient demandées à leur prochaine connexion. La page{" "}
          <strong>Bénévoles</strong> présente la liste complète et permet de la
          télécharger pour l&apos;ouvrir dans Excel.
        </p>
        <p className="mt-2 text-slate-700">
          <strong>Mot de passe perdu</strong> : dans la page{" "}
          <strong>Bénévoles</strong>, cliquez sur « Nouveau mot de passe » en
          face du bénévole. Un mot de passe provisoire s&apos;affiche :
          communiquez-le-lui (par téléphone par exemple). Il pourra ensuite le
          changer dans son espace, rubrique « Mon mot de passe ». Il n&apos;y a
          pas d&apos;envoi par email pour l&apos;instant.
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
