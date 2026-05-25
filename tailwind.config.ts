import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#06080d",
        sidebar: "#080b11",
        card: "#0c1018",
        border: "#1a2030",
        text: "#e8edf5",
        muted: "#5a6580",
        dimmed: "#3a4560",
        quote: "#a0afc0",
        green: "#00e5b0",
        red: "#ff4d6d",
        blue: "#0066ff",
        purple: "#b466ff",
        gold: "#f0c040",
      },
      fontFamily: {
        heading: ["var(--font-bebas)", "sans-serif"],
        mono: ["var(--font-dm-mono)", "monospace"],
        sans: ["var(--font-dm-sans)", "sans-serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
  safelist: [
    "font-heading",
    "font-mono",
    "font-sans",
    "text-text",
    "text-muted",
    "text-dimmed",
    "text-quote",
    "text-green",
    "text-red",
    "text-blue",
    "text-purple",
    "text-gold",
    "bg-bg",
    "bg-sidebar",
    "bg-card",
    "border-border",
    "hover:text-text",
    "hover:bg-card",
  ],
};

export default config;
