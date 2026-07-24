import type { Config } from "tailwindcss";

// Palette inspirée de mamiecyclette.fr : orange chaleureux (#f7a533) sur fond crème.
// Les classes "marine" (couleur de marque) et "soleil" (accent) sont réutilisées
// par tous les composants — changer ces valeurs restyle l'ensemble du site.
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Couleur de marque (oranges Mamiecyclette)
        marine: {
          50: "#fdf5e9",
          100: "#fbe2ba",
          400: "#f7a533",
          500: "#d47611",
          600: "#b8620c",
          700: "#8f4c0a",
        },
        // Accent (grand bouton d'appel a l'action)
        soleil: {
          400: "#f7a533",
          500: "#e8951f",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
