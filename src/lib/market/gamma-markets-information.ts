import {
  GAMMA_API_BASE,
  isGammaMarketRecord,
  type GammaMarketRecord
} from "@/lib/market/polymarket-gamma";
import { proxyPolymarketPost } from "@/service/prophet";

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

  const payload = await proxyPolymarketPost<unknown>(url.toString(), {
    conditionIds: normalizedIds
  });

  if (!Array.isArray(payload)) {
    throw new Error("Gamma markets/information returned a non-array payload.");
  }

  return payload.filter(isGammaMarketRecord);
}
