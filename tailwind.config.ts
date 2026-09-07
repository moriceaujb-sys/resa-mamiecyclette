import type { Config } from "tailwindcss";

// Charte Mamie Cyclette : crème, marine (navy), orange, bordeaux, bleu ciel.
// Les composants utilisent surtout "marine" (couleur foncée de marque) et
// "soleil" (accent orange, boutons d'action).
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        creme: "#fbf3e2", // fond de page
        marine: {
          50: "#eaedf3",
          100: "#cbd2e1",
          500: "#33406a",
          600: "#24304f",
          700: "#1b2440", // titres, texte de marque
        },
        orange: {
          400: "#f7bc5e",
          500: "#f4a93a",
          600: "#e1902a",
        },
        soleil: {
          400: "#f4a93a", // accent principal (boutons d'action)
          500: "#e1902a",
        },
        bordeaux: {
          500: "#a21e4a",
          600: "#86163c",
        },
        ciel: {
          300: "#c4dbee",
          500: "#9fc5e1",
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
