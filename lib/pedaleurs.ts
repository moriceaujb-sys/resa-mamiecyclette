import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Informations demandées aux pédaleurs pour l'assurance du CCAS.
export const champsAssurance = {
  telephone: z.string({ required_error: "Le téléphone est obligatoire." }).trim().min(6, "Téléphone invalide").max(30),
  dateNaissance: z
    .string({ required_error: "La date de naissance est obligatoire." })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date de naissance invalide")
    .refine((v) => {
      const d = new Date(`${v}T12:00:00Z`);
      const annee = d.getUTCFullYear();
      return !isNaN(d.getTime()) && annee >= 1920 && annee <= new Date().getFullYear() - 14;
    }, "Date de naissance invalide"),
  adresse: z.string({ required_error: "L'adresse postale est obligatoire." }).trim().min(5, "L'adresse postale est obligatoire.").max(240),
};

// Date "AAAA-MM-JJ" → valeur stockée (colonne date sans heure).
export function versDateNaissance(v: string): Date {
  return new Date(`${v}T00:00:00Z`);
}

export function profilComplet(p: {
  telephone: string | null;
  dateNaissance: Date | null;
  adresse: string | null;
}): boolean {
  return !!(p.telephone && p.dateNaissance && p.adresse);
}

// ---------- Côté admin : listing des bénévoles (assurance) ----------
export type BenevoleListe = {
  id: string;
  nom: string;
  dateNaissance: string | null; // "AAAA-MM-JJ"
  adresse: string | null;
  telephone: string | null;
  email: string;
  inscritLe: string;
  nbBalades: number;
};

export async function benevolesListe(): Promise<BenevoleListe[]> {
  const peds = await prisma.pedaleur.findMany({
    orderBy: { nom: "asc" },
    include: { _count: { select: { creneaux: true } } },
  });
  return peds.map((p) => ({
    id: p.id,
    nom: p.nom,
    dateNaissance: p.dateNaissance ? p.dateNaissance.toISOString().slice(0, 10) : null,
    adresse: p.adresse,
    telephone: p.telephone,
    email: p.email,
    inscritLe: p.createdAt.toISOString(),
    nbBalades: p._count.creneaux,
  }));
}
