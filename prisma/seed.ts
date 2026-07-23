import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Crée quelques créneaux de démonstration sur les 14 prochains jours
// (uniquement s'il n'existe encore aucun créneau).
async function main() {
  const existant = await prisma.creneau.count();
  if (existant > 0) {
    console.log(`↩︎  ${existant} créneau(x) déjà présents, seed ignoré.`);
    return;
  }

  const creneaux: { date: Date }[] = [];
  const aujourdHui = new Date();
  aujourdHui.setHours(0, 0, 0, 0);

  // Balades les mercredis et samedis, à 10h, 14h et 15h30.
  for (let jour = 1; jour <= 21; jour++) {
    const d = new Date(aujourdHui);
    d.setDate(d.getDate() + jour);
    const jourSemaine = d.getDay(); // 0 = dimanche ... 3 = mercredi, 6 = samedi
    if (jourSemaine === 3 || jourSemaine === 6) {
      for (const [h, m] of [
        [10, 0],
        [14, 0],
        [15, 30],
      ]) {
        const creneau = new Date(d);
        creneau.setHours(h, m, 0, 0);
        creneaux.push({ date: creneau });
      }
    }
  }

  await prisma.creneau.createMany({ data: creneaux });
  console.log(`✅ ${creneaux.length} créneaux de démonstration créés.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
