# 🚲 Resa Mamiecyclette

Site de réservation en ligne pour les **balades en triporteur** du CCAS.
Le public réserve un créneau en quelques clics, et l'équipe (CCAS + bénévoles)
gère les réservations depuis un espace dédié.

Projet collaboratif — pensé pour être déployé simplement sur **Railway** (comme
le projet Guinguette).

## Fonctionnalités

- **Calendrier de créneaux** : les créneaux disponibles s'affichent par jour,
  avec le nombre de places restantes.
- **Réservation en ligne** : formulaire simple et lisible (nom, téléphone,
  email facultatif, nombre de personnes, besoins particuliers).
- **Espace équipe** protégé par mot de passe :
  - liste des réservations avec statut (en attente / confirmée / annulée) ;
  - confirmation / annulation en un clic ;
  - gestion des créneaux (ajout, désactivation) ;
  - **saisie interne** d'une réservation prise par téléphone ou au guichet.
- **Notifications email** : confirmation à l'usager (si email fourni) + alerte à
  l'équipe à chaque nouvelle réservation.

## Stack technique

- [Next.js 14](https://nextjs.org/) (App Router, TypeScript)
- [Prisma](https://www.prisma.io/) + **PostgreSQL**
- [Tailwind CSS](https://tailwindcss.com/)
- [Nodemailer](https://nodemailer.com/) pour les emails

---

## 🚀 Démarrage en local

### 1. Prérequis

- Node.js 18+ ([nvm](https://github.com/nvm-sh/nvm) recommandé : `nvm use`)
- Un PostgreSQL. Le plus simple avec Docker :

  ```bash
  docker run --name mamiecyclette-db -e POSTGRES_PASSWORD=motdepasse \
    -e POSTGRES_DB=mamiecyclette -p 5432:5432 -d postgres:16
  ```

### 2. Installation

```bash
npm install
cp .env.example .env      # puis éditez .env (voir plus bas)
```

### 3. Base de données

```bash
npx prisma migrate deploy   # crée les tables
npm run seed                # (optionnel) crée des créneaux de démonstration
```

### 4. Lancer le site

```bash
npm run dev
```

Le site est sur http://localhost:3000 et l'espace équipe sur
http://localhost:3000/admin.

---

## 🔐 Variables d'environnement

Toutes les variables sont décrites dans **`.env.example`**. Les essentielles :

| Variable         | Rôle                                                       |
| ---------------- | ---------------------------------------------------------- |
| `DATABASE_URL`   | Connexion PostgreSQL (fournie automatiquement par Railway) |
| `ADMIN_PASSWORD` | Mot de passe de l'espace équipe (partagé)                  |
| `SESSION_SECRET` | Chaîne aléatoire longue pour signer le cookie admin        |
| `SMTP_*`         | Serveur d'envoi d'emails (facultatif)                      |
| `MAIL_FROM`      | Adresse expéditeur des emails                              |
| `MAIL_EQUIPE`    | Adresse qui reçoit les alertes de réservation              |

> 💡 Si aucun `SMTP_HOST` n'est renseigné, les emails ne sont pas envoyés mais
> affichés dans les logs (pratique en développement).

---

## ☁️ Déploiement sur Railway

1. Créez un nouveau projet sur [Railway](https://railway.app/) → **Deploy from
   GitHub repo** et choisissez ce dépôt.
2. Ajoutez un service **PostgreSQL** (New → Database → PostgreSQL). Railway crée
   automatiquement la variable `DATABASE_URL`.
3. Dans le service de l'application, onglet **Variables**, ajoutez :
   `ADMIN_PASSWORD`, `SESSION_SECRET`, et si besoin `SMTP_HOST`, `SMTP_PORT`,
   `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`, `MAIL_EQUIPE`.
   (Reliez `DATABASE_URL` à la base via « Add Reference » si nécessaire.)
4. Railway lance automatiquement `npm run build` — qui exécute
   `prisma generate && prisma migrate deploy && next build` — puis `npm run start`.
   Les tables sont donc créées au premier déploiement.
5. (Optionnel) Pour insérer des créneaux de démonstration, lancez une fois
   `npm run seed` depuis l'onglet Railway (ou créez vos créneaux via l'espace
   équipe).

---

## 📁 Structure du projet

```
app/
  page.tsx              Page publique (calendrier + réservation)
  reservation-flow.tsx  Composant de réservation (client)
  admin/                Espace équipe (connexion + tableau de bord)
  api/                  Routes API (réservations, admin, connexion)
lib/
  prisma.ts             Client Prisma
  auth.ts               Session admin (cookie signé)
  email.ts              Envoi des emails
  creneaux.ts           Calcul des créneaux disponibles
prisma/
  schema.prisma         Modèle de données
  migrations/           Migrations SQL
  seed.ts               Données de démonstration
```

---

## 🤝 Contribuer (dépôt collaboratif)

1. Clonez le dépôt et créez une branche : `git checkout -b ma-fonctionnalite`
2. Faites vos modifications, testez en local (`npm run dev`).
3. Ouvrez une Pull Request sur GitHub.

Le dépôt étant partagé, privilégiez les **branches + Pull Requests** plutôt que
de pousser directement sur `main`.

---

Fait avec ❤️ pour le CCAS.
