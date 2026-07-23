import { NextResponse } from "next/server";
import { motDePasseValide, creerSession } from "@/lib/auth";

export async function POST(request: Request) {
  const { password } = await request.json().catch(() => ({ password: "" }));
  if (typeof password !== "string" || !motDePasseValide(password)) {
    return NextResponse.json(
      { error: "Mot de passe incorrect." },
      { status: 401 }
    );
  }
  creerSession();
  return NextResponse.json({ ok: true });
}
