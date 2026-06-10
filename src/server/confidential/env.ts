import "server-only";

export interface ConfidentialEnv {
  oneClickUrl: string;
  oneClickApiKey: string;
  jwtPublicKey?: string;
  jwtIssuer?: string;
  nearIntentsEnv: "production" | "stage";
}

let cached: ConfidentialEnv | undefined;

export function getConfidentialEnv(): ConfidentialEnv {
  if (cached) {
    return cached;
  }

  const oneClickUrl = "https://1click.chaindefuser.com";
  const oneClickApiKey = process.env.ONE_CLICK_API_KEY?.trim();

  if (!oneClickUrl) {
    throw new Error("ONE_CLICK_URL is not configured.");
  }

  if (!oneClickApiKey) {
    throw new Error("ONE_CLICK_API_KEY is not configured.");
  }

  const jwtPublicKey = process.env.ONE_CLICK_JWT_PUBLIC_KEY?.trim() || undefined;
  const jwtIssuer = process.env.ONE_CLICK_JWT_ISSUER?.trim() || undefined;
  const nearIntentsEnv =
    process.env.NEAR_INTENTS_ENV?.trim() === "stage" ? "stage" : "production";

  cached = {
    oneClickUrl: oneClickUrl.replace(/\/$/, ""),
    oneClickApiKey,
    jwtPublicKey,
    jwtIssuer,
    nearIntentsEnv,
  };

  return cached;
}
