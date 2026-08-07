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
        // Institutional Terminal design tokens
        "surface-base": "#080a0f",
        "surface-1": "#0c0f17",
        "surface-2": "#111520",
        "surface-3": "#161b27",
        "border-subtle": "#1c2235",
        "border-active": "#2a3350",
        "accent-primary": "#00ff88",
        "accent-secondary": "#0ea5e9",
        "accent-warn": "#f59e0b",
        "accent-danger": "#ff3b5c",
        "accent-elite": "#a78bfa",
        "text-primary": "#e8edf5",
        "text-secondary": "#8892a4",
        "text-tertiary": "#4a5568",
        // Short aliases still referenced by className in source
        bg: "#080a0f",
        muted: "#8892a4",
      },
      fontFamily: {
        display: ["Syne", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        body: ["DM Sans", "sans-serif"],
        heading: ["var(--font-bebas)", "sans-serif"],
        sans: ["var(--font-dm-sans)", "sans-serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
  safelist: [
    "font-display",
    "font-mono",
    "font-body",
    "font-heading",
    "font-sans",
    "text-muted",
    "text-text-primary",
    "text-text-secondary",
    "text-text-tertiary",
    "bg-bg",
    "bg-surface-base",
    "bg-surface-1",
    "bg-surface-2",
    "border-border-subtle",
  ],
};

export default config;
