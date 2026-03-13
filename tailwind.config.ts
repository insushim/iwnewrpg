import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "game-dark": "#0a0a0f",
        "game-gold": "#ffd700",
        "game-hp": "#ff3333",
        "game-mp": "#3366ff",
        "game-exp": "#33ff33",
        "game-rare": "#3366ff",
        "game-epic": "#9933ff",
        "game-legendary": "#ff9900",
        "game-mythic": "#ff0033",
      },
    },
  },
};

export default config;
