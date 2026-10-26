// Charte du pédaleur et contacts utiles : affichés dans l'espace pédaleur et dans
// l'aide & doc de l'espace équipe.

import Telephone from "@/app/telephone";

export const TEL_MAMIE_CYCLETTE = "06 42 31 03 48";

// Charte du pédaleur (document Mamie Cyclette / CCAS).
const CHARTE = [
  "S'inscrire sur des créneaux via le planning partagé par Mamie Cyclette",
  "Vérifier la veille si un senior s'est inscrit",
  "Préparer son trajet de l'Espace Robert Robin au domicile du senior",
  "Honorer les rendez-vous en arrivant à l'horaire indiqué au domicile du senior",
  "Prendre en charge le promeneur à l'extérieur de son domicile (si le pédaleur est invité à entrer dans le domicile, le CCAS décline toute responsabilité dans ce moment de convivialité)",
  "Respecter la confidentialité et la discrétion concernant les échanges avec les participants, la manipulation des données personnelles des seniors",
  "M'assurer du bon fonctionnement du vélo avant et après la balade",
  "Prévenir Mamie Cyclette en cas d'impossibilité à assurer la balade",
  "Respecter le code de la route",
  "Assurer la sécurité des passagers en appliquant les bons usages acquis en formation",
  "Partager un moment convivial avec les passagers en favorisant les échanges",
  "Être à l'écoute des passagers, de leur ressenti en adaptant ma conduite",
  "Rapporter à Mamie Cyclette tout dysfonctionnement constaté sur le vélo et les éventuelles difficultés rencontrées avec les passagers",
];

// Contacts utiles au pédaleur (fiche Mamie Cyclette / CCAS).
const CONTACTS: { sujet: string; numeros: { nom: string; tel: string; note?: string }[] }[] = [
  {
    sujet: "Premier contact promeneurs / pédaleurs",
    numeros: [{ nom: "CCAS - Angers seniors animation", tel: "02 41 23 13 31" }],
  },
  {
    sujet: "Planning, seniors, pédaleurs, retards, annulations…",
    numeros: [{ nom: "Mamie Cyclette", tel: TEL_MAMIE_CYCLETTE }],
  },
  {
    sujet: "Accès à l'Espace Robert Robin, au triporteur, aux accessoires, stockage et mise en charge batterie",
    numeros: [
      { nom: "Espace Robert Robin", tel: "02 41 68 55 77" },
      { nom: "Cadre d'astreinte CCAS", tel: "06 16 48 34 64", note: "week-end uniquement" },
    ],
  },
  {
    sujet: "Problème mécanique pendant la balade nécessitant une intervention",
    numeros: [{ nom: "COBI l'atelier vélo", tel: "07 56 99 55 24" }],
  },
  {
    sujet: "Conseils vélo, dépannage à distance",
    numeros: [{ nom: "Banzaï Cycles", tel: "07 77 16 42 00" }],
  },
];

const URGENCES = [
  { nom: "Numéro d'urgence", tel: "112" },
  { nom: "SAMU", tel: "15" },
  { nom: "Pompiers", tel: "18" },
  { nom: "Police secours", tel: "17" },
  { nom: "Police municipale Angers", tel: "02 41 05 40 17" },
  { nom: "Police municipale Angers", tel: "02 41 05 44 69" },
];

function Tel({ tel }: { tel: string }) {
  return <Telephone numero={tel} className="font-semibold" />;
}


export function Charte() {
  return (
    <>
      <p className="mb-3 text-sm text-slate-600">
        Vélo triporteur pour balades seniors, quartier de la Roseraie.
      </p>
      <p className="font-semibold text-slate-700">
        En tant que pédaleur volontaire, je m&apos;engage à :
      </p>
      <ol className="mt-2 list-decimal space-y-1 pl-6 text-slate-700">
        {CHARTE.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ol>
    </>
  );
}

export function Contacts() {
  return (
    <>
      <dl className="space-y-3">
        {CONTACTS.map((c) => (
          <div key={c.sujet}>
            <dt className="font-semibold text-slate-800">{c.sujet}</dt>
            {c.numeros.map((n) => (
              <dd key={n.tel} className="text-slate-700">
                {n.nom}
                {n.note && (
                  <span className="font-medium text-bordeaux-500"> ({n.note})</span>
                )}{" "}
                : <Tel tel={n.tel} />
              </dd>
            ))}
          </div>
        ))}
      </dl>
      <div className="mt-4 rounded-lg bg-marine-50 p-4">
        <h3 className="font-semibold text-marine-700">
          Sécurité, accident de circulation, dommages corporels
        </h3>
        <ul className="mt-1 space-y-0.5 text-slate-700">
          {URGENCES.map((u) => (
            <li key={u.tel}>
              {u.nom} : <Tel tel={u.tel} />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
