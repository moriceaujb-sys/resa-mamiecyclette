import type { Metadata } from "next";
import Link from "next/link";
import { Montserrat, Grand_Hotel } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});
const grandHotel = Grand_Hotel({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-script",
});

export const metadata: Metadata = {
  title: "Mamie Cyclette — Balades en triporteur",
  description:
    "Réservez une balade en triporteur avec le CCAS. Un moment convivial, en toute simplicité.",
};

function Roue() {
  return (
    <svg
      width="38"
      height="38"
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <circle cx="20" cy="20" r="17" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="20" cy="20" r="3" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.4">
        <line x1="20" y1="4" x2="20" y2="36" />
        <line x1="4" y1="20" x2="36" y2="20" />
        <line x1="8.7" y1="8.7" x2="31.3" y2="31.3" />
        <line x1="31.3" y1="8.7" x2="8.7" y2="31.3" />
      </g>
    </svg>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${montserrat.variable} ${grandHotel.variable}`}>
      <body>
        <header className="border-b border-marine-100 bg-white">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-marine-700">
              <Roue />
              <span className="font-script text-3xl leading-none">
                Mamie Cyclette
              </span>
            </Link>
            <Link
              href="/admin"
              className="text-sm font-medium text-marine-600 hover:text-marine-700"
            >
              Espace équipe
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
        <footer className="mt-12 border-t border-marine-100 py-6">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 px-4 text-center text-sm text-slate-600">
            <div>Mamie Cyclette · Balades en triporteur du CCAS</div>
            <div className="flex flex-col items-center gap-1">
              <span>En partenariat avec la Ville d&apos;Angers</span>
              {/* Emplacement du logo officiel de la Ville d'Angers.
                  Déposez le fichier dans public/ (ex. angers.png) puis
                  décommentez la ligne ci-dessous. */}
              {/* <img src="/angers.png" alt="Ville d'Angers" className="h-10" /> */}
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
