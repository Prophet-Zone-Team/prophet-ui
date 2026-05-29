import "server-only";

export interface OneClickConfig {
  baseUrl: string;
  apiKey: string;
  jwtPublicKey?: string;
  jwtIssuer?: string;
  intentsEnv: "production" | "stage";
  referral: string;
}

export function getOneClickConfig(): OneClickConfig {
  const baseUrl = process.env.ONE_CLICK_URL?.trim();
  const apiKey = process.env.ONE_CLICK_API_KEY?.trim();

  if (!baseUrl) {
    throw new Error("ONE_CLICK_URL is not configured.");
  }

  if (!apiKey) {
    throw new Error("ONE_CLICK_API_KEY is not configured.");
  }

  const intentsEnvRaw = process.env.ONE_CLICK_INTENTS_ENV?.trim() ?? "production";

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    apiKey,
    jwtPublicKey: process.env.ONE_CLICK_JWT_PUBLIC_KEY?.trim() || undefined,
    jwtIssuer: process.env.ONE_CLICK_JWT_ISSUER?.trim() || undefined,
    intentsEnv: intentsEnvRaw === "stage" ? "stage" : "production",
    referral: process.env.ONE_CLICK_REFERRAL?.trim() || "prophet-ui",
  };
}
