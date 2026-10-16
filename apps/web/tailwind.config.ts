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
        "on-accent": "rgb(var(--on-accent-rgb) / <alpha-value>)",
        amber: {
          DEFAULT: "rgb(var(--amber-rgb) / <alpha-value>)",
          soft: "rgb(var(--amber-soft-rgb) / <alpha-value>)",
        },
        moss: "rgb(var(--moss-rgb) / <alpha-value>)",
        /* Legacy brand aliases → brand navy ramp (FoodRide palette). */
        navy: {
          DEFAULT: "rgb(var(--ember-rgb) / <alpha-value>)",
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
          DEFAULT: "rgb(var(--gold-rgb) / <alpha-value>)",
          soft: "rgb(var(--gold-soft-rgb) / <alpha-value>)",
          // Readable on the ivory field; use for any gold-coloured text.
          text: "rgb(var(--gold-text-rgb) / <alpha-value>)",
          50: "#F9F4EC",
          100: "#F0E6D0",
          200: "#E1CDA1",
          300: "#D2B472",
          400: "#C2A878",
          500: "#A88E5E",
          600: "#8E7444",
        },
        /* `bg-ink` etc. are used for dark header strips and avatar chips —
           Deep Navy #0B1F3A so they read as brand navy in both themes. */
        ink: {
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
        ivory: {
          DEFAULT: "#FBF5F0",
          50: "#FFFCFB",
          100: "#FBF5F0",
        },
        charcoal: {
          DEFAULT: "#2E2E2E",
        },
        gray: {
          DEFAULT: "#BABABA",
          400: "#BABABA",
          500: "#8A8A8A",
        },
        "app-bg": "rgb(var(--bg-primary-rgb) / <alpha-value>)",
        "app-fg": "rgb(var(--text-primary-rgb) / <alpha-value>)",
        "app-card": "rgb(var(--bg-card-rgb) / <alpha-value>)",
        "app-panel": "rgb(var(--bg-card-rgb) / <alpha-value>)",
        "app-input": "rgb(var(--bg-input-rgb) / <alpha-value>)",
        "app-elevated": "rgb(var(--bg-elevated-rgb) / <alpha-value>)",
        "app-footer": "rgb(var(--bg-card-rgb) / <alpha-value>)",
        "app-muted": "rgb(var(--text-secondary-rgb) / <alpha-value>)",
        /* Secondary surface (section strips, skeleton base) and the faint
           placeholder/meta ink. `signal` is the berbere accent used for date
           markers, live dots and saved hearts — deliberately not the same
           token as the primary `ember` navy. */
        "app-alt": "rgb(var(--bg-alt-rgb) / <alpha-value>)",
        "app-subtle": "rgb(var(--text-muted-rgb) / <alpha-value>)",
        signal: "rgb(var(--gold-rgb) / <alpha-value>)",
        "app-border": "var(--border)",
        success: "rgb(var(--success-rgb) / <alpha-value>)",
        danger: "rgb(var(--danger-rgb) / <alpha-value>)",
        warning: "rgb(var(--warning-rgb) / <alpha-value>)",
        /* ── Partner console ────────────────────────────────────────
           Deliberately theme-independent (fixed light console, always
           dark sidebar). The backing vars live in globals.css scoped to
           `.shell-console`, so these utilities only resolve inside the
           organizer + restaurant dashboard shell — the public site and
           the admin portal keep the ember/glass system untouched. */
        console: {
          DEFAULT: "rgb(var(--console-card-rgb) / <alpha-value>)",
          bg: "rgb(var(--console-bg-rgb) / <alpha-value>)",
          card: "rgb(var(--console-card-rgb) / <alpha-value>)",
          border: "rgb(var(--console-border-rgb) / <alpha-value>)",
          nav: "rgb(var(--console-nav-rgb) / <alpha-value>)",
          "nav-soft": "rgb(var(--console-nav-soft-rgb) / <alpha-value>)",
          "nav-muted": "rgb(var(--console-nav-muted-rgb) / <alpha-value>)",
          ink: "rgb(var(--console-ink-rgb) / <alpha-value>)",
          muted: "rgb(var(--console-muted-rgb) / <alpha-value>)",
          indigo: "rgb(var(--console-indigo-rgb) / <alpha-value>)",
          "indigo-deep": "rgb(var(--console-indigo-deep-rgb) / <alpha-value>)",
          "indigo-soft": "rgb(var(--console-indigo-soft-rgb) / <alpha-value>)",
          /* On-dark variant of the accent, for the navy sidebar. */
          "nav-accent": "rgb(var(--console-nav-accent-rgb) / <alpha-value>)",
          green: "rgb(var(--console-green-rgb) / <alpha-value>)",
          mint: "rgb(var(--console-mint-rgb) / <alpha-value>)",
          "mint-ink": "rgb(var(--console-mint-ink-rgb) / <alpha-value>)",
          blush: "rgb(var(--console-blush-rgb) / <alpha-value>)",
          "blush-ink": "rgb(var(--console-blush-ink-rgb) / <alpha-value>)",
          sand: "rgb(var(--console-sand-rgb) / <alpha-value>)",
          "sand-ink": "rgb(var(--console-sand-ink-rgb) / <alpha-value>)",
          sky: "rgb(var(--console-sky-rgb) / <alpha-value>)",
          "sky-ink": "rgb(var(--console-sky-ink-rgb) / <alpha-value>)",
        },
      },
      fontFamily: {
        /* Display = Bricolage Grotesque (headings, prices, date numerals).
           Body = Instrument Sans. Both are self-hosted via next/font/local
           in app/layout.tsx; the literal names are the safety fallback. */
        display: ["var(--font-display)", "Bricolage Grotesque", "system-ui", "sans-serif"],
        heading: ["var(--font-display)", "Bricolage Grotesque", "system-ui", "sans-serif"],
        serif: ["var(--font-display)", "Bricolage Grotesque", "system-ui", "sans-serif"],
        body: ["var(--font-space)", "Instrument Sans", "system-ui", "sans-serif"],
        sans: ["var(--font-space)", "Instrument Sans", "system-ui", "sans-serif"],
      },
      boxShadow: {
        /* Driven by the token layer so light/dark stay in step. */
        soft: "var(--shadow-sm)",
        card: "var(--shadow-md)",
        elevate: "var(--shadow-lg)",
        glass: "var(--glass-shadow)",
        "glass-strong": "var(--glass-shadow-strong)",
        "dark-sm": "0 1px 3px rgb(0 0 0 / 0.2)",
        "dark-card": "0 2px 4px rgb(0 0 0 / 0.2), 0 8px 24px rgb(0 0 0 / 0.28)",
        "dark-elevate": "0 4px 8px rgb(0 0 0 / 0.2), 0 16px 48px rgb(0 0 0 / 0.4)",
        /* legacy names → same tokens */
        hard: "var(--shadow-sm)",
        "hard-lg": "var(--shadow-md)",
        "console-card": "var(--console-shadow)",
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
