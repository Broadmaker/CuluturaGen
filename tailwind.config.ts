import type { Config } from "tailwindcss";

// AttireLab professional theme: heritage-lab identity.
// Deep ink surfaces, brass accents, warm paper background, serif display type.
// Semantic badge colors (green/amber/red) stay untouched in statusTone.ts.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0b1f1e",
          900: "#102927",
          800: "#163734",
          700: "#1e4a46",
          600: "#2a5f59",
          100: "#d7e3e1",
          50: "#eef4f3",
        },
        brass: {
          700: "#7d5510",
          600: "#9a6b12",
          500: "#b9861a",
          400: "#d2a93b",
          200: "#e9d49a",
          100: "#f5ead0",
          50: "#fbf6e9",
        },
        paper: "#faf8f3",
      },
      fontFamily: {
        display: ["Georgia", "'Times New Roman'", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgb(16 41 39 / 0.06), 0 4px 16px -4px rgb(16 41 39 / 0.10)",
        pop: "0 8px 32px -8px rgb(16 41 39 / 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
