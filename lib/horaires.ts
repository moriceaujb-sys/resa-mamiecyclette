// Configuration des créneaux récurrents de balade.
// Modifiez ces valeurs pour changer les jours, horaires, durée, capacité ou
// l'horizon de réservation.

export const JOURS_OUVERTS = [1, 3, 5]; // 1 = lundi, 3 = mercredi, 5 = vendredi
export const HORAIRES = [
  { h: 10, min: 0 },
  { h: 11, min: 0 },
  { h: 14, min: 0 },
  { h: 15, min: 30 },
];
export const DUREE_MINUTES = 60; // créneaux d'une heure
export const CAPACITE = 2; // places par créneau (capacité du triporteur)
export const LIEU_DEPART = "Devant le CCAS";
export const HORIZON_JOURS = 120; // ~4 mois glissants de réservation à l'avance

const TZ = "Europe/Paris";

// Décalage (en minutes) du fuseau de Paris pour un instant donné (gère l'heure d'été).
function offsetParis(ts: number): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const m: Record<string, string> = {};
  for (const p of dtf.formatToParts(new Date(ts))) m[p.type] = p.value;
  let hour = Number(m.hour);
  if (hour === 24) hour = 0;
  const asUTC = Date.UTC(
    Number(m.year),
    Number(m.month) - 1,
    Number(m.day),
    hour,
    Number(m.minute),
    Number(m.second)
  );
  return (asUTC - ts) / 60000;
}

// Instant UTC correspondant à une heure "murale" de Paris.
function parisVersUtc(y: number, mo: number, d: number, h: number, mi: number): Date {
  const guess = Date.UTC(y, mo, d, h, mi);
  const off = offsetParis(guess);
  return new Date(guess - off * 60000);
}

// Composantes (année, mois 0-11, jour) d'un instant, lues en heure de Paris.
function partsParis(date: Date): { y: number; mo: number; d: number } {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const m: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) m[p.type] = p.value;
  return { y: Number(m.year), mo: Number(m.month) - 1, d: Number(m.day) };
}

// Jour de la semaine (0=dim … 6=sam) d'un instant, en heure de Paris.
function jourSemaineParis(date: Date): number {
  const s = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" }).format(date);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[s] ?? 0;
}

// Génère la liste des instants de créneaux (selon la règle) entre `from` (exclu) et `to` (inclus).
export function genererSlots(from: Date, to: Date): Date[] {
  const slots: Date[] = [];
  let { y, mo, d } = partsParis(from);
  for (let i = 0; i < 420; i++) {
    const midi = parisVersUtc(y, mo, d, 12, 0);
    if (midi.getTime() > to.getTime()) break;
    if (JOURS_OUVERTS.includes(jourSemaineParis(midi))) {
      for (const t of HORAIRES) {
        const slot = parisVersUtc(y, mo, d, t.h, t.min);
        if (slot.getTime() > from.getTime() && slot.getTime() <= to.getTime()) {
          slots.push(slot);
        }
      }
    }
    // Jour calendaire suivant (en heure de Paris).
    const lendemain = new Date(midi.getTime() + 24 * 3600 * 1000);
    ({ y, mo, d } = partsParis(lendemain));
  }
  return slots;
}
