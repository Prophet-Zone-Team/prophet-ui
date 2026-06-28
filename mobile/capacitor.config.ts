import type { CapacitorConfig } from "@capacitor/cli";

const ENV = process.env.CAPACITOR_ENV ?? "production";

// Simulator: http://localhost:3000 works when `pnpm dev` runs on the same Mac.
// Physical device: set CAPACITOR_DEV_URL=http://<your-lan-ip>:3000 and run
// `pnpm dev --hostname 0.0.0.0 --port 3000`.
const developmentUrl =
  process.env.CAPACITOR_DEV_URL?.trim() || "http://localhost:3000";

const SERVER_URL: Record<string, string> = {
  production: "https://app.prophet.zone",
  staging: "https://test.prophet.zone",
  development: developmentUrl,
};

const isDevelopment = ENV === "development";

const config: CapacitorConfig = {
  appId: "zone.prophet.app",
  appName: "Prophet",
  webDir: "www",
  server: {
    url: SERVER_URL[ENV] ?? SERVER_URL.production,
    cleartext: isDevelopment,
    androidScheme: "https",
  },
  ios: {
    contentInset: "automatic",
    allowsLinkPreview: false,
    scrollEnabled: true,
    backgroundColor: "#F9FAFC",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: "#F9FAFC",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#F9FAFC",
    },
  },
};

export default config;
