import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "mc_admin";

function secret(): string {
  return process.env.SESSION_SECRET || "dev-secret-non-securise";
}

// Génère un jeton signé simple (HMAC). Suffisant pour un accès admin
// partagé protégé par mot de passe unique.
function signer(valeur: string): string {
  const h = crypto.createHmac("sha256", secret()).update(valeur).digest("hex");
  return `${valeur}.${h}`;
}

function verifier(token: string | undefined): boolean {
  if (!token) return false;
  const [valeur, signature] = token.split(".");
  if (!valeur || !signature) return false;
  const attendu = crypto
    .createHmac("sha256", secret())
    .update(valeur)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(attendu)
    );
  } catch {
    return false;
  }
}

export function motDePasseValide(motDePasse: string): boolean {
  const attendu = process.env.ADMIN_PASSWORD || "";
  if (!attendu) return false;
  const a = Buffer.from(motDePasse);
  const b = Buffer.from(attendu);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function creerSession() {
  const token = signer("admin");
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 heures
  });
}

export function detruireSession() {
  cookies().delete(COOKIE_NAME);
}

export function estConnecte(): boolean {
  const token = cookies().get(COOKIE_NAME)?.value;
  return verifier(token);
}

export const ADMIN_COOKIE = COOKIE_NAME;
export { verifier as verifierToken };
