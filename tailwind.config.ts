import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        prophet: {
          navy: "#07142d",
          ink: "#07142d",
          nav: "#667188",
          muted: "#909090",
          line: "#ebebeb",
          panel: "#ffffff",
          red: "#d64545",
          green: "#65af14"
        },
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
          cyan: "#57c7ff"
        }
      },
      fontFamily: {
        display: [
          "var(--font-display)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif"
        ],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "monospace"
        ]
      },
      boxShadow: {
        terminal: "0 24px 80px rgba(0, 0, 0, 0.35)",
        heat: "0 0 42px rgba(255, 106, 42, 0.16)",
        prophet: "0 10px 32px rgba(29, 75, 135, 0.08)",
        "prophet-row": "0 8px 20px rgba(31, 75, 130, 0.04)",
        "prophet-button": "0 10px 26px rgba(18, 82, 246, 0.3)",
        "prophet-wallet": "0 10px 22px rgba(31, 75, 130, 0.08)"
      },
      borderRadius: {
        prophet: "8px"
      },
      keyframes: {
        "prophet-loading": {
          "0%": { backgroundPosition: "120% 0" },
          "100%": { backgroundPosition: "-120% 0" }
        },
        "match-status-pulse": {
          "0%, 100%": { transform: "scale(0.8)", opacity: "1" },
          "50%": { transform: "scale(1.25)", opacity: "0.55" }
        }
      },
      animation: {
        "prophet-loading": "prophet-loading 1.5s ease-in-out infinite",
        "match-status-pulse": "match-status-pulse 1.6s ease-in-out infinite"
      },
      backgroundSize: {
        "prophet-shimmer": "220% 100%"
      }
    }
  },
  plugins: []
};

export default config;
