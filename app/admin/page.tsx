import Link from "next/link";

export const dynamic = "force-dynamic";

const CARTES = [
  {
    href: "/admin/creneaux",
    emoji: "🗓️",
    titre: "Créneaux",
    desc: "Voir les statuts, ajouter, modifier, désactiver ou supprimer les créneaux.",
  },
  {
    href: "/admin/beneficiaires",
    emoji: "🧓",
    titre: "Bénéficiaires",
    desc: "Rechercher un bénéficiaire, consulter et modifier sa fiche.",
  },
  {
    href: "/admin/aides",
    emoji: "📖",
    titre: "Aide & doc",
    desc: "Fonctionnement de la réservation, statuts, règles.",
  },
];

export default function AdminHome() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {CARTES.map((c) => (
        <Link
          key={c.href}
          href={c.href}
          className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <div className="text-4xl" aria-hidden>
            {c.emoji}
          </div>
          <h2 className="mt-3 text-lg font-bold text-marine-700">{c.titre}</h2>
          <p className="mt-1 text-sm text-slate-500">{c.desc}</p>
        </Link>
      ))}
    </div>
  );
}
