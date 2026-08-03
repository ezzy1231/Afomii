/** @type {import('tailwindcss').Config} */
module.exports = {
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
        ivory: {
          DEFAULT: "#F8F5F0",
          50: "#FFFDF8",
          100: "#F8F5F0",
          200: "#EDE6D9",
          300: "#E2D7C2",
          400: "#D7C8AB",
          500: "#CCB994",
        },
        gold: {
          DEFAULT: "#C2A878",
          50: "#F9F4EC",
          100: "#F0E6D0",
          200: "#E1CDA1",
          300: "#D2B472",
          400: "#C2A878",
          500: "#A88E5E",
          600: "#8E7444",
        },
        charcoal: {
          DEFAULT: "#2E2E2E",
          50: "#F5F5F5",
          100: "#E0E0E0",
          200: "#BDBDBD",
          300: "#9E9E9E",
          400: "#757575",
          500: "#2E2E2E",
        },
        gray: {
          DEFAULT: "#8A8A8A",
          50: "#F7F7F7",
          100: "#E0E0E0",
          200: "#CCCCCC",
          300: "#B0B0B0",
          400: "#8A8A8A",
          500: "#6B6B6B",
        },
      },
      fontFamily: {
        heading: ["Playfair Display", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
