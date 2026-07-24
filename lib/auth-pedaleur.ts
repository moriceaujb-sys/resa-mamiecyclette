import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual, createHmac } from "crypto";

const COOKIE = "mc_pedaleur";

function secret(): string {
  return process.env.SESSION_SECRET || "dev-secret-non-securise";
}

// --- Mots de passe (scrypt, sans dépendance externe) ---
export function hashMotDePasse(motDePasse: string): string {
  const sel = randomBytes(16).toString("hex");
  const dk = scryptSync(motDePasse, sel, 64).toString("hex");
  return `${sel}:${dk}`;
}

export function verifieMotDePasse(motDePasse: string, stocke: string): boolean {
  const [sel, cle] = stocke.split(":");
  if (!sel || !cle) return false;
  const dk = scryptSync(motDePasse, sel, 64);
  const attendu = Buffer.from(cle, "hex");
  if (attendu.length !== dk.length) return false;
  return timingSafeEqual(attendu, dk);
}

// --- Session (cookie signé contenant l'id du pédaleur) ---
function signe(valeur: string): string {
  const h = createHmac("sha256", secret()).update(valeur).digest("hex");
  return `${valeur}.${h}`;
}

function verifie(token: string | undefined): string | null {
  if (!token) return null;
  const i = token.lastIndexOf(".");
  if (i < 0) return null;
  const valeur = token.slice(0, i);
  const signature = token.slice(i + 1);
  const attendu = createHmac("sha256", secret()).update(valeur).digest("hex");
  try {
    if (timingSafeEqual(Buffer.from(signature), Buffer.from(attendu))) return valeur;
  } catch {
    return null;
  }
  return null;
}

export function creerSessionPedaleur(pedaleurId: string) {
  cookies().set(COOKIE, signe(pedaleurId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 jours
  });
}

export function detruireSessionPedaleur() {
  cookies().delete(COOKIE);
}

export function pedaleurConnecteId(): string | null {
  return verifie(cookies().get(COOKIE)?.value);
}
