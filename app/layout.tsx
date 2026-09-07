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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${montserrat.variable} ${grandHotel.variable}`}>
      <body>
        <header className="border-b border-marine-100 bg-white">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" aria-label="Mamie Cyclette — accueil" className="flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/mamie-cyclette-logo.png"
                alt="Mamie Cyclette"
                className="h-11 w-auto"
              />
            </Link>
            <div className="flex items-center gap-4 sm:gap-5">
              <a
                href="https://www.angers.fr/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Site de la Ville d'Angers"
                className="shrink-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/angers-logo.svg"
                  alt="Ville d'Angers"
                  className="h-10 w-auto"
                />
              </a>
              <Link
                href="/admin"
                className="text-sm font-medium text-marine-600 hover:text-marine-700"
              >
                Espace équipe
              </Link>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
        <footer className="mt-12 border-t border-marine-100 py-8">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 text-center text-sm text-slate-600">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mamie-cyclette-logo.png"
              alt="Mamie Cyclette"
              className="h-14 w-auto"
            />
            <div>Mamie Cyclette · Balades en triporteur du CCAS</div>
            <div className="flex flex-col items-center gap-2">
              <span>En partenariat avec la Ville d&apos;Angers</span>
              <a
                href="https://www.angers.fr/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Site de la Ville d'Angers"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/angers-logo.svg"
                  alt="Ville d'Angers"
                  className="h-14 w-auto"
                />
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
