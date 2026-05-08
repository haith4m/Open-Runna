/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0A0A0A",
          surface: "#141414",
          elevated: "#1E1E1E",
          overlay: "#2A2A2A",
        },
        brand: {
          DEFAULT: "#00D4AA",
          muted: "#00D4AA33",
          dark: "#00A882",
        },
        accent: {
          DEFAULT: "#FF6B6B",
          muted: "#FF6B6B33",
        },
        zone: {
          recovery: "#6B7280",
          easy: "#34D399",
          marathon: "#60A5FA",
          threshold: "#FBBF24",
          interval: "#F97316",
          repetition: "#EF4444",
        },
        text: {
          primary: "#FFFFFF",
          secondary: "#A0A0A0",
          muted: "#606060",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui"],
        mono: ["JetBrainsMono", "monospace"],
      },
    },
  },
};
