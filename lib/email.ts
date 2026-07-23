import nodemailer from "nodemailer";

type Reservation = {
  nomClient: string;
  telephone: string;
  email?: string | null;
  nombrePersonnes: number;
  besoinsParticuliers?: string | null;
};

type Creneau = {
  date: Date;
  lieuDepart: string;
};

function formaterDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function transport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST) return null; // mode démo : pas de SMTP configuré
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT) === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASSWORD } : undefined,
  });
}

async function envoyer(options: {
  to: string;
  subject: string;
  text: string;
}) {
  const t = transport();
  const from = process.env.MAIL_FROM || "Mamiecyclette <no-reply@exemple.fr>";
  if (!t) {
    // Pas de SMTP configuré : on log l'email au lieu de l'envoyer.
    console.log("📧 [MODE DÉMO — email non envoyé]");
    console.log(`   À : ${options.to}`);
    console.log(`   Objet : ${options.subject}`);
    console.log(options.text);
    return;
  }
  try {
    await t.sendMail({ from, ...options });
  } catch (e) {
    console.error("Erreur d'envoi d'email :", e);
  }
}

// Email de confirmation envoyé à l'usager (si une adresse est fournie).
export async function envoyerConfirmationClient(
  reservation: Reservation,
  creneau: Creneau
) {
  if (!reservation.email) return;
  const texte = `Bonjour ${reservation.nomClient},

Votre demande de balade en triporteur est bien enregistrée :

  • Date : ${formaterDate(creneau.date)}
  • Lieu de départ : ${creneau.lieuDepart}
  • Nombre de personnes : ${reservation.nombrePersonnes}

Votre réservation sera confirmée prochainement par l'équipe du CCAS.
Si vous avez un empêchement, merci de nous prévenir.

À bientôt,
L'équipe Mamiecyclette`;

  await envoyer({
    to: reservation.email,
    subject: "Votre balade en triporteur — demande enregistrée",
    text: texte,
  });
}

// Alerte envoyée à l'équipe du CCAS à chaque nouvelle réservation.
export async function envoyerAlerteEquipe(
  reservation: Reservation,
  creneau: Creneau
) {
  const destinataire = process.env.MAIL_EQUIPE;
  if (!destinataire) return;
  const texte = `Nouvelle réservation de balade :

  • Date : ${formaterDate(creneau.date)}
  • Départ : ${creneau.lieuDepart}
  • Nom : ${reservation.nomClient}
  • Téléphone : ${reservation.telephone}
  • Email : ${reservation.email || "—"}
  • Personnes : ${reservation.nombrePersonnes}
  • Besoins particuliers : ${reservation.besoinsParticuliers || "—"}

Connectez-vous à l'espace admin pour la confirmer.`;

  await envoyer({
    to: destinataire,
    subject: `Nouvelle réservation — ${reservation.nomClient}`,
    text: texte,
  });
}
