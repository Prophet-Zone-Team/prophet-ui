import { fetchPolymarket } from "@/lib/market/polymarket-api-client";
import type { GammaMarketRecord } from "@/lib/market/polymarket-gamma";
import { mapGammaMarketToTeamSnapshot } from "@/lib/market/winner-event-mapper";
import type { TeamMarketSnapshot, UserPositionRecord } from "@/types/market";

export async function fetchPositionSellSnapshot(
  position: UserPositionRecord
): Promise<TeamMarketSnapshot | undefined> {
  const slug = position.slug?.trim();

  if (!slug) {
    return undefined;
  }

  try {
    const market = await fetchPolymarket<GammaMarketRecord>(
      `/markets/slug/${encodeURIComponent(slug)}`
    );

    return mapGammaMarketToTeamSnapshot(market, { expectedSlug: slug });
  } catch {
    return undefined;
  }
}
