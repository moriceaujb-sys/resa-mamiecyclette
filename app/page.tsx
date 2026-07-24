import { ensureCreneaux, creneauxPourBeneficiaires } from "@/lib/creneaux";
import ReservationFlow from "./reservation-flow";

export const dynamic = "force-dynamic";

export default async function Page() {
  await ensureCreneaux();
  const creneaux = await creneauxPourBeneficiaires();

  return (
    <div>
      <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <span className="mb-3 inline-block rounded-full bg-marine-100 px-3 py-1 text-sm font-semibold text-marine-700">
          Respirez la liberté !
        </span>
        <h1 className="text-3xl font-bold text-marine-700 sm:text-4xl">
          Envie d&apos;une balade en triporteur ?
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-600">
          Indiquez toutes vos disponibilités ci-dessous — un seul créneau, plusieurs,
          ou toute une journée. Dès que deux personnes sont disponibles au même moment,
          un pédaleur bénévole confirme la balade et vous êtes prévenus.
        </p>
        <p className="mt-2 text-base text-slate-500">
          Une question ou un empêchement ? Appelez le CCAS, nous réservons pour vous.
        </p>
      </section>

      <ReservationFlow creneaux={creneaux} />
    </div>
  );
}
