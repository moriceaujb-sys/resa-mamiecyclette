import type { Config } from "tailwindcss";

// Charte Mamie Cyclette — couleurs exactes relevées sur la charte graphique.
// crème #f9f0dc · bleu ciel #9dc0e5 · orange #f5a432 · bordeaux #9f1e44 · marine #1e1b3a
// Les composants utilisent surtout "marine" (foncé de marque : titres, boutons,
// sélection) et "soleil" (accent orange : boutons d'action).
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        creme: "#f9f0dc",
        marine: {
          50: "#edecf2",
          100: "#d2d0de",
          500: "#3a3566",
          600: "#2a2650",
          700: "#1e1b3a",
        },
        orange: {
          400: "#f7b657",
          500: "#f5a432",
          600: "#e08c1e",
        },
        soleil: {
          400: "#f5a432",
          500: "#e08c1e",
        },
        bordeaux: {
          500: "#9f1e44",
          600: "#851739",
        },
        ciel: {
          300: "#c3dbef",
          500: "#9dc0e5",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        script: ["var(--font-script)", "cursive"],
      },
    },
  },
  plugins: [],
};

export default config;
