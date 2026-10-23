# Resa Mamiecyclette — contexte pour Claude Code

Site de mise en relation pour les balades en triporteur du CCAS (Mamie Cyclette / Ville d'Angers).
**En production** : https://resa.mamiecyclette.fr — réponds et commente le code en français.

## Stack et structure
- Next.js 14 (App Router, TypeScript), Prisma + PostgreSQL, Tailwind CSS.
- `app/page.tsx` : page d'accueil publique (`app/accueil.tsx` — présentation, vidéo Vimeo,
  appel aux pédaleurs volontaires) ; un pédaleur connecté y voit directement son tableau de bord.
  Photo d'accroche attendue dans `public/balade-triporteur.jpg` (repli sur le logo si absente).
- `app/admin/*` : espace équipe (mot de passe `ADMIN_PASSWORD`) — réservation, créneaux,
  bénéficiaires, tableau de bord de pilotage (`app/admin/pilotage`, indicateurs dans
  `lib/pilotage.ts`), aide & doc (`app/admin/aides/page.tsx` = documentation utilisateur, à tenir
  à jour à chaque changement de règle métier).
- `app/pedaleur/*` : espace pédaleur (connexion / inscription libre, `?mode=inscription`
  ouvre l'onglet création de compte ; tableau de bord).
- `app/infos-pedaleur.tsx` : charte du pédaleur et contacts utiles (affichés dans l'espace
  pédaleur et dans l'aide & doc).
- `app/api/*` : routes (zod pour la validation).
- `lib/statut.ts` (statuts d'un créneau), `lib/creneaux.ts` (génération + requêtes),
  `lib/horaires.ts` (règle récurrente), `lib/beneficiaires.ts`.

## Règles métier (état au 23/10/2026)
- Un créneau = 2 places de bénéficiaires (passagers) + 1 pédaleur (bénévole). Créneaux
  récurrents lundi, mercredi, vendredi (60 min) : 10h, 11h15, 15h, 16h à l'heure d'été ;
  10h, 11h15, 14h30, 15h45 à l'heure d'hiver (`lib/horaires.ts`, `estHeureHiver`). Horizon
  ~120 jours, générés par `ensureCreneaux()` avec un repère glissant
  (`Configuration.genereJusquau`) : les modifications manuelles ne sont jamais réécrasées.
  Mises à jour ponctuelles des données : `Configuration.versionDonnees` (`miseAJourV1`).
- Départ du domicile de la personne (adresse obligatoire) ; le triporteur se récupère à
  l'Espace Robert Robin (`LIEU_DEPART`, `LIEU_TRIPORTEUR`).
- Couple (`Beneficiaire.couple`) : occupe les 2 places (`places()` dans `lib/creneaux.ts`),
  seulement sur un créneau vide.
- Un pédaleur peut se retirer d'une balade à venir (`retirerPedaleur()`) : bénéficiaires
  repassent EN_ATTENTE, rien n'est supprimé. L'équipe peut faire de même (page Créneaux).
- Pédaleur : téléphone, date de naissance, adresse demandés pour l'assurance du CCAS
  (obligatoires à l'inscription, demandés aux anciens comptes au tableau de bord) ;
  listing + export CSV dans `app/admin/benevoles`. Pastille « Nouveau » via
  `Pedaleur.derniereVisite`.
- Bénéficiaire (sans compte) : l'équipe enregistre ses disponibilités sur 1..n créneaux
  (`Disponibilite` EN_ATTENTE). Quand un pédaleur confirme, seuls les bénéficiaires de CE créneau
  passent CONFIRMEE et leurs autres disponibilités passent LIBEREE.
- Pédaleur : peut prendre un créneau dès 1 bénéficiaire en attente. Un 2e bénéficiaire peut
  rejoindre la balade prévue (confirmé direct) **seulement si le départ est à plus de 48 h**
  (`DELAI_REJOINDRE_HEURES`, filtré côté liste et côté API).
- Structure (`Beneficiaire.type = STRUCTURE`, `nbBeneficiairesEstime` obligatoire, email et
  adresse obligatoires) : réserve fermement un ou plusieurs créneaux ENTIERS (seulement des
  créneaux à 0 bénéficiaire sans pédaleur), vient avec son propre pédaleur, pas de libération.
  Techniquement : `Disponibilite` CONFIRMEE dont le bénéficiaire est STRUCTURE. Statut de
  créneau dédié `COMPLET_STRUCTURE` (« Complet pour une structure », vert, sans ratio).
- Six statuts de créneau dans `lib/statut.ts` : DISPO, CHERCHE_MOITIE, COMPLET_ATTENTE_PEDALEUR,
  PEDALEUR_CHERCHE_PASSAGER, COMPLET_AVEC_PEDALEUR, COMPLET_STRUCTURE.

## Commandes
- Types : `node_modules/.bin/tsc --noEmit` (à lancer avant tout commit).
- Après un changement de `prisma/schema.prisma` : `npx prisma generate`.
- Déploiement : **automatique** — Railway est relié à GitHub, chaque push sur `main` part en
  production en quelques minutes (depuis le 23/10/2026). Ne pousser sur `main` que ce qui est
  prêt à être en ligne ; sinon travailler sur une branche.
  Le `start` Railway fait `prisma db push --accept-data-loss --skip-generate` : le schéma est
  synchronisé au déploiement, pas de migrations.
- SQL ponctuel sur la base de prod : `echo '<SQL>' | npx prisma db execute --schema prisma/schema.prisma --stdin`
  (DATABASE_URL dans `.env`, non versionné). **Piège** : `Creneau.date` est un `timestamp`
  sans fuseau stocké en UTC ; pour comparer une heure de Paris, écrire
  `(date AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Paris'` (un simple `AT TIME ZONE 'Europe/Paris'`
  convertit à l'envers et vise les mauvais créneaux).
- Reset des données de test (garde les pédaleurs) :
  `TRUNCATE "Disponibilite","Beneficiaire","Creneau","Configuration" RESTART IDENTITY CASCADE;`

## Conventions
- Charte Mamie Cyclette (orange #f7a533 sur fond crème, classes `marine-*`, `soleil-*`,
  `btn-primary`, `btn-soleil`, `btn-ghost`, `champ`, `label`), contrastes WCAG AA.
- Textes d'interface en français, sans jargon ; l'équipe du CCAS n'est pas technique.
- Ne pas committer `.env`. Comptes de test pédaleur : voir le projet Claude « Resa Mamiecyclette CCAS ».

## Pistes en attente
- Emails Brevo (lib/email.ts existe mais n'est pas branché), rythme récurrent éditable en admin, export CSV, rappels la veille.
