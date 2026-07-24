import { NextResponse } from "next/server";
import { detruireSessionPedaleur } from "@/lib/auth-pedaleur";

export async function POST() {
  detruireSessionPedaleur();
  return NextResponse.json({ ok: true });
}
