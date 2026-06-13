import {
  GAMMA_API_BASE,
  isGammaMarketRecord,
  type GammaMarketRecord
} from "@/lib/market/polymarket-gamma";

const GAMMA_MARKETS_INFORMATION_LIMIT = 100;

export async function fetchGammaMarketsInformation(
  conditionIds: string[]
): Promise<GammaMarketRecord[]> {
  const normalizedIds = [
    ...new Set(
      conditionIds.map((id) => id.trim()).filter(Boolean)
    )
  ];

  if (normalizedIds.length === 0) {
    return [];
  }

  const url = new URL(`${GAMMA_API_BASE}/markets/information`);
  url.searchParams.set("limit", String(GAMMA_MARKETS_INFORMATION_LIMIT));

  const response = await fetch(url, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json"
    },
    body: JSON.stringify({ conditionIds: normalizedIds }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(
      `Gamma markets/information returned HTTP ${response.status}.`
    );
  }

  const payload = (await response.json()) as unknown;

  if (!Array.isArray(payload)) {
    throw new Error("Gamma markets/information returned a non-array payload.");
  }

  return payload.filter(isGammaMarketRecord);
}
