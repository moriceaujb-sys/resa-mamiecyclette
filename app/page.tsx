import { creneauxDisponibles } from "@/lib/creneaux";
import ReservationFlow from "./reservation-flow";

// La page est rendue dynamiquement pour toujours afficher les places à jour.
export const dynamic = "force-dynamic";

export default async function Page() {
  const creneaux = await creneauxDisponibles();

  return (
    <div>
      <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-bold text-marine-700 sm:text-4xl">
          Réservez votre balade en triporteur
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-600">
          Offrez-vous une sortie conviviale accompagnée par un bénévole du
          CCAS. Choisissez un créneau ci-dessous, laissez vos coordonnées, et
          nous vous confirmons la balade.
        </p>
        <p className="mt-2 text-base text-slate-500">
          Un empêchement ou une question ? Appelez le CCAS, nous réservons pour
          vous.
        </p>
      </section>

      <ReservationFlow creneaux={creneaux} />
    </div>
  );
}
