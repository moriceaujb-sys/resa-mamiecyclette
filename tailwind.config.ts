import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        marine: {
          50: "#eef6f9",
          100: "#d3e7ef",
          500: "#2b7a99",
          600: "#236478",
          700: "#1c4f5f",
        },
        soleil: {
          400: "#f4b942",
          500: "#e8a317",
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
