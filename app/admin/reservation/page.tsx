import { estConnecte } from "@/lib/auth";
import { ensureCreneaux, creneauxPourBeneficiaires } from "@/lib/creneaux";
import ReservationFlow from "@/app/reservation-flow";

export const dynamic = "force-dynamic";

export default async function ReservationPage() {
  if (!estConnecte()) return null;
  await ensureCreneaux();
  const creneaux = await creneauxPourBeneficiaires();

  return (
    <div>
      <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-marine-700">
          Réservation pour un bénéficiaire
        </h1>
        <p className="mt-2 text-slate-600">
          Enregistrez les disponibilités d&apos;un bénéficiaire : sélectionnez un
          ou plusieurs créneaux (ou toute une journée), puis renseignez ses
          coordonnées.
        </p>
      </div>
      <ReservationFlow creneaux={creneaux} />
    </div>
  );
}
