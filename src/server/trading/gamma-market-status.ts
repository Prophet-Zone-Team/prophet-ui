import "server-only";

import { GAMMA_API_BASE, type GammaMarketRecord } from "@/lib/market/polymarket-gamma";
import { serverFetch } from "@/server/trading/server-fetch";

export async function fetchGammaMarketAcceptingOrders(input: {
  slug?: string;
  conditionId?: string;
}): Promise<boolean | undefined> {
  const slug = input.slug?.trim();
  const conditionId = input.conditionId?.trim();

  if (!slug && !conditionId) {
    return undefined;
  }

  const url = new URL(`${GAMMA_API_BASE}/markets`);

  if (conditionId) {
    url.searchParams.set("condition_ids", conditionId);
  } else if (slug) {
    url.searchParams.set("slug", slug);
  }

  url.searchParams.set("limit", "1");

  const response = await serverFetch(url, {
    cache: "no-store",
    headers: {
      accept: "application/json"
    }
  });

  if (!response.ok) {
    return undefined;
  }

  const payload = (await response.json()) as GammaMarketRecord[];
  const market = Array.isArray(payload) ? payload[0] : undefined;

  if (market?.acceptingOrders === true) {
    return true;
  }

  if (market?.acceptingOrders === false) {
    return false;
  }

  return undefined;
}
