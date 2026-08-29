import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0C0C0E",
        surface: "#17171A",
        border: "#2A2A2E",
        ink: "#F2F1EC",
        muted: "#8B8B92",
        dim: "#5A5A60",
        gold: "#C9A227",
        positive: "#6FA287",
        negative: "#B5533C",
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
