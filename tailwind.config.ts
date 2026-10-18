import type { Config } from "tailwindcss";

// AttireLab theme — modeled on the EzMart admin-dashboard reference:
// vivid orange accents, warm neutral ink, soft cream canvas, rounded cards
// and a geometric grotesk (Plus Jakarta Sans) for display type.
// Semantic badge colors (green/amber/red/blue) stay untouched in statusTone.ts.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Primary accent — the reference's signature orange.
        brand: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
        },
        // Legacy alias kept so existing `brass-*` utilities render as orange.
        brass: {
          700: "#c2410c",
          600: "#ea580c",
          500: "#f97316",
          400: "#fb923c",
          300: "#fdba74",
          200: "#fed7aa",
          100: "#ffedd5",
          50: "#fff7ed",
        },
        // Warm neutral ink — headings, dark surfaces, muted text.
        ink: {
          950: "#171412",
          900: "#292524",
          800: "#44403c",
          700: "#57534e",
          600: "#6b6560",
          500: "#78716c",
          400: "#a8a29e",
          300: "#d6d3d1",
          100: "#e7e5e4",
          50: "#f5f5f4",
        },
        // Warm the cool-grey `neutral-*` utilities used across legacy pages.
        neutral: {
          50: "#fafaf9",
          100: "#f5f5f4",
          200: "#e7e5e4",
          300: "#d6d3d1",
          400: "#a8a29e",
          500: "#78716c",
          600: "#57534e",
          700: "#44403c",
          800: "#292524",
          900: "#1c1917",
          950: "#0c0a09",
        },
        paper: "#f7f3ec",
        surface: "#ffffff",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgb(28 25 23 / 0.04), 0 10px 30px -18px rgb(28 25 23 / 0.20)",
        pop: "0 18px 48px -16px rgb(28 25 23 / 0.28)",
      },
      borderRadius: {
        xl2: "1.125rem",
      },
    },
  },
  plugins: [],
};

export default config;
