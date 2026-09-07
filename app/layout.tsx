import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mamiecyclette — Balades en triporteur",
  description:
    "Réservez une balade en triporteur avec le CCAS. Un moment convivial, en toute simplicité.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <header className="border-b border-marine-100 bg-white">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl" aria-hidden>
                🚲
              </span>
              <span className="text-xl font-bold text-marine-700">
                Mamiecyclette
              </span>
            </Link>
            <Link
              href="/admin"
              className="text-sm text-slate-400 hover:text-marine-600"
            >
              Espace équipe
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
        <footer className="mt-12 border-t border-marine-100 py-6 text-center text-sm text-slate-400">
          Mamiecyclette · Balades en triporteur du CCAS
        </footer>
      </body>
    </html>
  );
}
