import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { estConnecte } from "@/lib/auth";

// Activer / désactiver un créneau (sans supprimer les disponibilités existantes).
const majSchema = z.object({
  id: z.string().min(1),
  actif: z.boolean(),
});

export async function PATCH(request: Request) {
  if (!estConnecte())
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const parsed = majSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }
  await prisma.creneau.update({
    where: { id: parsed.data.id },
    data: { actif: parsed.data.actif },
  });
  return NextResponse.json({ ok: true });
}
