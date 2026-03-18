import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "game-dark": "#060810",
        "game-gold": "#d4a647",
        "game-gold-light": "#f0d060",
        "game-gold-dark": "#8e7540",
        "game-hp": "#c2263e",
        "game-mp": "#2b58d8",
        "game-exp": "#c9a13d",
        "game-rare": "#4488ff",
        "game-epic": "#9933ff",
        "game-legendary": "#ff8c00",
        "game-mythic": "#ff2244",
        "game-common": "#b0b0b0",
        "game-uncommon": "#44cc44",
        "game-stone": "#0a0e18",
        "game-stone-mid": "#141c2a",
        "game-cream": "#f2e4c2",
        "game-bronze": "#b48a46",
      },
      boxShadow: {
        panel:
          "0 4px 32px rgba(0, 0, 0, 0.6), 0 0 1px rgba(180, 138, 70, 0.3), inset 0 1px 0 rgba(255, 240, 200, 0.04)",
        "glow-gold": "0 0 12px rgba(212, 166, 71, 0.3)",
        "glow-red": "0 0 12px rgba(194, 38, 62, 0.3)",
        "glow-blue": "0 0 12px rgba(43, 88, 216, 0.3)",
      },
    },
  },
};

export default config;
