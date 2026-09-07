import type { Config } from "tailwindcss";
import sharedConfig from "@urbanexplore/tailwind-config";

const config: Config = {
  presets: [sharedConfig],
  /* The app toggles dark mode via the `data-theme` attribute on <html>
     (set by ThemeToggle + the theme-init inline script in layout.tsx).
     Point the `dark:` variant at that attribute so every `dark:*` utility
     follows the in-app toggle instead of the OS prefers-color-scheme. */
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/config-tailwind/index.js",
  ],
  theme: {
    extend: {
      opacity: {
        /* allow /8 and /12 alpha steps used across the UI (glass tints) */
        8: "0.08",
        12: "0.12",
      },
      colors: {
        /* Single accent — ember. Aliases resolve to it so legacy
           class names keep working without competing colors. */
        ember: {
          DEFAULT: "rgb(var(--ember-rgb) / <alpha-value>)",
          deep: "rgb(var(--ember-deep-rgb) / <alpha-value>)",
          soft: "rgb(var(--ember-soft-rgb) / <alpha-value>)",
        },
        amber: {
          DEFAULT: "rgb(var(--amber-rgb) / <alpha-value>)",
          soft: "rgb(var(--amber-soft-rgb) / <alpha-value>)",
        },
        moss: "rgb(var(--moss-rgb) / <alpha-value>)",
        /* Legacy brand aliases → neutral / accent */
        navy: {
          DEFAULT: "rgb(var(--text-primary-rgb) / <alpha-value>)",
          50: "#F4F1EC",
          100: "#E6E2DA",
          200: "#CDC7BB",
          300: "#B3AC9E",
          400: "#948D80",
          500: "#6E6A60",
          600: "#524F49",
          700: "#3A3833",
          800: "#26251F",
          900: "#17161A",
        },
        gold: {
          DEFAULT: "rgb(var(--gold-rgb) / <alpha-value>)",
          soft: "rgb(var(--gold-soft-rgb) / <alpha-value>)",
          50: "#FDF6EA",
          100: "#FAEBD3",
          200: "#F5D6A4",
          300: "#F0C275",
          400: "#EBAD4B",
          500: "#E0891E",
        },
        ink: {
          DEFAULT: "#121622",
          50: "#F4F1EC",
          100: "#E6E2DA",
          200: "#CDC7BB",
          300: "#B3AC9E",
          400: "#948D80",
          500: "#6E6A60",
          600: "#524F49",
          700: "#3A3833",
          800: "#26251F",
          900: "#121622",
        },
        ivory: {
          DEFAULT: "#F8F2EB",
          50: "#FDFBF7",
          100: "#F8F2EB",
        },
        charcoal: {
          DEFAULT: "#121622",
        },
        "app-bg": "rgb(var(--bg-primary-rgb) / <alpha-value>)",
        "app-fg": "rgb(var(--text-primary-rgb) / <alpha-value>)",
        "app-card": "rgb(var(--bg-card-rgb) / <alpha-value>)",
        "app-panel": "rgb(var(--bg-card-rgb) / <alpha-value>)",
        "app-input": "rgb(var(--bg-input-rgb) / <alpha-value>)",
        "app-elevated": "rgb(var(--bg-elevated-rgb) / <alpha-value>)",
        "app-footer": "rgb(var(--bg-card-rgb) / <alpha-value>)",
        "app-muted": "rgb(var(--text-secondary-rgb) / <alpha-value>)",
        "app-border": "var(--border)",
        success: "rgb(var(--success-rgb) / <alpha-value>)",
        danger: "rgb(var(--danger-rgb) / <alpha-value>)",
        warning: "rgb(var(--warning-rgb) / <alpha-value>)",
      },
      fontFamily: {
        /* One clean sans family everywhere — display = sans, bold */
        display: ["var(--font-space)", "system-ui", "sans-serif"],
        serif: ["var(--font-space)", "system-ui", "sans-serif"],
        sans: ["var(--font-space)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgb(16 18 27 / 0.04), 0 2px 8px rgb(16 18 27 / 0.04)",
        card: "0 2px 4px rgb(16 18 27 / 0.04), 0 8px 24px rgb(16 18 27 / 0.07)",
        elevate: "0 4px 8px rgb(16 18 27 / 0.05), 0 16px 48px rgb(16 18 27 / 0.1)",
        glass: "var(--glass-shadow)",
        "glass-strong": "var(--glass-shadow-strong)",
        "dark-sm": "0 1px 3px rgb(0 0 0 / 0.2)",
        "dark-card": "0 2px 4px rgb(0 0 0 / 0.2), 0 8px 24px rgb(0 0 0 / 0.28)",
        "dark-elevate": "0 4px 8px rgb(0 0 0 / 0.2), 0 16px 48px rgb(0 0 0 / 0.4)",
        /* legacy names → soft equivalents */
        hard: "0 1px 2px rgb(16 18 27 / 0.05), 0 2px 8px rgb(16 18 27 / 0.05)",
        "hard-lg": "0 2px 4px rgb(16 18 27 / 0.05), 0 8px 24px rgb(16 18 27 / 0.08)",
      },
      transitionTimingFunction: {
        // clean ease-out for micro-interactions (no bounce/overshoot)
        out: "cubic-bezier(0.22, 1, 0.36, 1)",
        glide: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
