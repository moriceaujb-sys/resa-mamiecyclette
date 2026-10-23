import { estConnecte } from "@/lib/auth";
import { benevolesListe } from "@/lib/pedaleurs";

// Export du listing des bénévoles pour l'assurance du CCAS (fichier ouvrable dans
// Excel : séparateur « ; » et encodage reconnu grâce à l'en-tête BOM).
function cellule(v: string | null): string {
  const s = v ?? "";
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function dateFr(iso: string | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export async function GET() {
  if (!estConnecte()) return new Response("Non autorisé.", { status: 401 });
  const benevoles = await benevolesListe();
  const lignes = [
    ["Nom et prénom", "Date de naissance", "Adresse postale", "Téléphone", "Email", "Inscrit le"],
    ...benevoles.map((b) => [
      b.nom,
      dateFr(b.dateNaissance),
      b.adresse,
      b.telephone,
      b.email,
      dateFr(b.inscritLe),
    ]),
  ];
  const csv = "﻿" + lignes.map((l) => l.map(cellule).join(";")).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="benevoles-assurance.csv"',
    },
  });
}
