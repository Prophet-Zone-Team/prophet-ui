import "server-only";

import { fetchClobBestPrices } from "@/server/trading/clob-user-client";
import { serverFetch } from "@/server/trading/server-fetch";
import type {
  PolymarketFeeDetails,
  PolymarketFixtureMoneylineOutcome,
  WorldCupMatch,
} from "@/types/market";

const CLOB_MARKET_URL = "https://clob.polymarket.com/clob-markets";
const CLOB_FETCH_CONCURRENCY = 16;

interface ClobMarketDetails {
  fd?: {
    r?: number;
    e?: number;
    to?: boolean;
  };
  mbf?: number;
  tbf?: number;
}

export async function enrichFootballMatchesWithClobData(
  matches: WorldCupMatch[],
): Promise<WorldCupMatch[]> {
  const tokenIds = new Set<string>();
  const conditionIds = new Set<string>();

  for (const match of matches) {
    for (const outcome of match.polymarket?.moneyline.outcomes ?? []) {
      if (outcome.tokenId) {
        tokenIds.add(outcome.tokenId);
      }

      if (outcome.noTokenId) {
        tokenIds.add(outcome.noTokenId);
      }

      if (outcome.conditionId) {
        conditionIds.add(outcome.conditionId);
      }
    }
  }

  const [pricesByToken, feesByCondition] = await Promise.all([
    fetchBestPricesBatch([...tokenIds]),
    fetchFeesBatch([...conditionIds]),
  ]);

  return matches.map((match) => applyClobDataToMatch(match, pricesByToken, feesByCondition));
}

async function fetchBestPricesBatch(
  tokenIds: string[],
): Promise<Map<string, { bestBid?: number; bestAsk?: number }>> {
  const pricesByToken = new Map<string, { bestBid?: number; bestAsk?: number }>();

  await mapWithConcurrency(tokenIds, CLOB_FETCH_CONCURRENCY, async (tokenId) => {
    try {
      const prices = await fetchClobBestPrices(tokenId);
      pricesByToken.set(tokenId, prices);
    } catch {
      pricesByToken.set(tokenId, {});
    }
  });

  return pricesByToken;
}

async function fetchFeesBatch(
  conditionIds: string[],
): Promise<Map<string, PolymarketFeeDetails>> {
  const feesByCondition = new Map<string, PolymarketFeeDetails>();

  await mapWithConcurrency(conditionIds, CLOB_FETCH_CONCURRENCY, async (conditionId) => {
    try {
      const fee = await fetchFeeByConditionId(conditionId);

      if (fee) {
        feesByCondition.set(conditionId, fee);
      }
    } catch {
      // Ignore fee lookup failures; preview falls back to zero fee.
    }
  });

  return feesByCondition;
}

async function fetchFeeByConditionId(
  conditionId: string,
): Promise<PolymarketFeeDetails | undefined> {
  const response = await serverFetch(`${CLOB_MARKET_URL}/${encodeURIComponent(conditionId)}`, {
    cache: "no-store",
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    return undefined;
  }

  const payload = (await response.json()) as ClobMarketDetails;
  const rate = toNumber(payload.fd?.r);
  const exponent = toNumber(payload.fd?.e);

  if (rate === undefined || exponent === undefined) {
    return undefined;
  }

  return {
    rate,
    exponent,
    takerOnly: payload.fd?.to === true,
    makerBaseFee: toNumber(payload.mbf),
    takerBaseFee: toNumber(payload.tbf),
  };
}

function applyClobDataToMatch(
  match: WorldCupMatch,
  pricesByToken: Map<string, { bestBid?: number; bestAsk?: number }>,
  feesByCondition: Map<string, PolymarketFeeDetails>,
): WorldCupMatch {
  if (!match.polymarket?.moneyline.outcomes.length) {
    return match;
  }

  const outcomes = match.polymarket.moneyline.outcomes.map((outcome) =>
    enrichOutcomeWithClobData(outcome, pricesByToken, feesByCondition),
  );

  return {
    ...match,
    polymarket: {
      ...match.polymarket,
      moneyline: {
        ...match.polymarket.moneyline,
        outcomes,
      },
    },
  };
}

function enrichOutcomeWithClobData(
  outcome: PolymarketFixtureMoneylineOutcome,
  pricesByToken: Map<string, { bestBid?: number; bestAsk?: number }>,
  feesByCondition: Map<string, PolymarketFeeDetails>,
): PolymarketFixtureMoneylineOutcome {
  const yesPrices = outcome.tokenId ? pricesByToken.get(outcome.tokenId) : undefined;
  const noPrices = outcome.noTokenId ? pricesByToken.get(outcome.noTokenId) : undefined;
  const fee = outcome.conditionId ? feesByCondition.get(outcome.conditionId) : undefined;

  return {
    ...outcome,
    yesAsk: yesPrices?.bestAsk,
    yesBid: yesPrices?.bestBid,
    noAsk: noPrices?.bestAsk,
    noBid: noPrices?.bestBid,
    fee,
  };
}

async function mapWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  if (items.length === 0) {
    return;
  }

  let index = 0;

  async function runWorker() {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      await worker(items[currentIndex]!);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker()),
  );
}

function toNumber(value: number | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
