import { notFound } from "next/navigation";
import { estConnecte } from "@/lib/auth";
import { beneficiaireDetail } from "@/lib/beneficiaires";
import BeneficiaireDetailVue from "./detail";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: { id: string } }) {
  if (!estConnecte()) return null;
  const b = await beneficiaireDetail(params.id);
  if (!b) notFound();
  return <BeneficiaireDetailVue b={b} />;
}
