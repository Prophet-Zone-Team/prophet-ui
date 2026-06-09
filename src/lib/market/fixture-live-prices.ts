import "server-only";

import { buildFixtureMarketsSnapshot } from "@/lib/market/build-fixture-markets-snapshot";
import { resolveFixtureOutcomesForTab } from "@/lib/market/fixture-tab-outcomes";
import { fetchClobBestPrices } from "@/server/trading/clob-user-client";
import type { GameMarketTabId } from "@/views/trade/game/markets/fixture-market-actions";
import type { FixtureMarketOutcome, WorldCupMatch } from "@/types/market";

export interface LiveOutcomePrices {
  yesAsk?: number;
  yesBid?: number;
  noAsk?: number;
  noBid?: number;
}

export interface FixtureLivePricesResult {
  matchSlug: string;
  tab: GameMarketTabId;
  lineKey?: string;
  prices: Record<string, LiveOutcomePrices>;
  updatedAt: string;
}

const VALID_TABS: GameMarketTabId[] = [
  "moneyline",
  "totals",
  "spreads",
  "halftime",
  "top_scores",
];

export function isValidGameMarketTab(tab: string): tab is GameMarketTabId {
  return VALID_TABS.includes(tab as GameMarketTabId);
}

export async function fetchFixtureLivePricesForTab(
  match: WorldCupMatch,
  tab: GameMarketTabId,
  lineKey?: string,
): Promise<FixtureLivePricesResult> {
  const fixtureMarkets = buildFixtureMarketsSnapshot(match);
  const outcomes = resolveFixtureOutcomesForTab(fixtureMarkets, tab, lineKey);
  const tokenIds = collectOutcomeTokenIds(outcomes);
  const pricesByToken = await fetchBestPricesBatch(tokenIds);

  const prices: Record<string, LiveOutcomePrices> = {};

  for (const outcome of outcomes) {
    const yesPrices = outcome.tokenId
      ? pricesByToken.get(outcome.tokenId)
      : undefined;
    const noPrices = outcome.noTokenId
      ? pricesByToken.get(outcome.noTokenId)
      : undefined;

    prices[outcome.id] = {
      yesAsk: yesPrices?.bestAsk,
      yesBid: yesPrices?.bestBid,
      noAsk: noPrices?.bestAsk,
      noBid: noPrices?.bestBid,
    };
  }

  return {
    matchSlug: match.id,
    tab,
    lineKey,
    prices,
    updatedAt: new Date().toISOString(),
  };
}

function collectOutcomeTokenIds(outcomes: FixtureMarketOutcome[]): string[] {
  const tokenIds = new Set<string>();

  for (const outcome of outcomes) {
    if (outcome.tokenId) {
      tokenIds.add(outcome.tokenId);
    }

    if (outcome.noTokenId) {
      tokenIds.add(outcome.noTokenId);
    }
  }

  return [...tokenIds];
}

async function fetchBestPricesBatch(
  tokenIds: string[],
): Promise<Map<string, { bestBid?: number; bestAsk?: number }>> {
  const pricesByToken = new Map<string, { bestBid?: number; bestAsk?: number }>();

  await Promise.all(
    tokenIds.map(async (tokenId) => {
      try {
        const prices = await fetchClobBestPrices(tokenId);
        pricesByToken.set(tokenId, prices);
      } catch {
        pricesByToken.set(tokenId, {});
      }
    }),
  );

  return pricesByToken;
}
