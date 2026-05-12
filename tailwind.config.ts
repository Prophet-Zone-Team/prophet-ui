import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        terminal: {
          black: "#05070a",
          panel: "#0b1016",
          panel2: "#101823",
          line: "#223040",
          muted: "#7c8996",
          text: "#e7eef5",
          green: "#24d18b",
          red: "#ff5f6d",
          amber: "#f4b860",
          orange: "#ff8a3d",
          ember: "#ff6a2a",
          bone: "#fff0d0",
          cyan: "#57c7ff",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        terminal: "0 24px 80px rgba(0, 0, 0, 0.35)",
        heat: "0 0 42px rgba(255, 106, 42, 0.16)",
      },
    },
  },
  plugins: [],
};

export default config;
