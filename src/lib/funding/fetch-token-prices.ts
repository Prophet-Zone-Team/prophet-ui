import { getTokenPriceApiUrl } from "@/config/funding/prices";
import type { TokenPriceApiResponse, TokenPricesBySymbol } from "@/types/funding";

function isTokenPricesBySymbol(value: unknown): value is TokenPricesBySymbol {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every((entry) => typeof entry === "string");
}

export async function fetchTokenPrices(signal?: AbortSignal): Promise<TokenPricesBySymbol> {
  const response = await fetch(getTokenPriceApiUrl(), {
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Token price request failed: ${response.status}`);
  }

  const payload = (await response.json()) as TokenPriceApiResponse;

  if (payload.code !== 0 || !payload.data) {
    throw new Error("Token price API returned an invalid response.");
  }

  if (!isTokenPricesBySymbol(payload.data)) {
    throw new Error("Token price API data is not a symbol-to-price map.");
  }

  return payload.data;
}
