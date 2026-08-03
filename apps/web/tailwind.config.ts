import type { Config } from "tailwindcss";
import sharedConfig from "@urbanexplore/tailwind-config";

const config: Config = {
  presets: [sharedConfig],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/config-tailwind/index.js",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0B1F3A",
          50: "#F0F3F8",
          100: "#D6DDE8",
          200: "#ADBBD1",
          300: "#8499BA",
          400: "#5B77A3",
          500: "#3D5A82",
          600: "#2A3F5E",
          700: "#1B2F4C",
          800: "#0B1F3A",
          900: "#061221",
        },
        gold: {
          DEFAULT: "#C2A878",
          50: "#F9F4EC",
          100: "#F0E6D0",
          200: "#E1CDA1",
          300: "#D2B472",
          400: "#C2A878",
          500: "#A88E5E",
        },
        ivory: {
          DEFAULT: "#F8F5F0",
          50: "#FFFDF8",
          100: "#F8F5F0",
        },
        charcoal: {
          DEFAULT: "#111827",
        },
        "app-bg": "var(--bg-primary)",
        "app-fg": "var(--text-primary)",
        "app-panel": "var(--bg-card)",
        "app-footer": "var(--bg-card)",
        "app-muted": "var(--text-secondary)",
        "app-border": "var(--border)",
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "12px",
        md: "16px",
        lg: "20px",
        xl: "24px",
        "2xl": "28px",
      },
      boxShadow: {
        soft: "0 1px 3px rgba(0,0,0,.04)",
        card: "0 4px 20px rgba(0,0,0,.06)",
        elevate: "0 8px 30px rgba(0,0,0,.08)",
        "dark-sm": "0 1px 3px rgba(0,0,0,.2)",
        "dark-card": "0 4px 20px rgba(0,0,0,.3)",
        "dark-elevate": "0 10px 35px rgba(0,0,0,.35)",
      },
    },
  },
  plugins: [],
};

export default config;
