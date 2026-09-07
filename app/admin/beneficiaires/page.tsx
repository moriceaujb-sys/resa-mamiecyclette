import { estConnecte } from "@/lib/auth";
import { beneficiairesListe } from "@/lib/beneficiaires";
import BeneficiairesTable from "./table";

export const dynamic = "force-dynamic";

export default async function BeneficiairesPage() {
  if (!estConnecte()) return null;
  const beneficiaires = await beneficiairesListe();
  return <BeneficiairesTable beneficiaires={beneficiaires} />;
}
