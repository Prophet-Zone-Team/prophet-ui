import {
  firstGammaNumber,
  parseGammaArrayField,
  priceToProbability,
  toGammaNumber,
  type GammaMarketRecord,
} from "@/lib/market/polymarket-gamma";
import { normalizeMarketTickSize } from "@/lib/market/order-math";
import type { PolymarketMarketMetadata } from "@/types/market";

export function extractWinnerProbability(market: GammaMarketRecord): number | undefined {
  const outcomePrices = parseGammaArrayField(market.outcomePrices);
  const yesPrice = toGammaNumber(outcomePrices[0]);

  return priceToProbability(yesPrice);
}

export function extractFastBidPolymarketMetadata(
  market: GammaMarketRecord,
): PolymarketMarketMetadata | undefined {
  const clobTokenIds = parseGammaArrayField(market.clobTokenIds).map(String);
  const outcomes = parseGammaArrayField(market.outcomes).map(String);
  const outcomePrices = parseGammaArrayField(market.outcomePrices);
  const yesIndex = outcomes.findIndex((outcome) => outcome.toLowerCase() === "yes");
  const noIndex = outcomes.findIndex((outcome) => outcome.toLowerCase() === "no");
  const yesTokenId = clobTokenIds[yesIndex >= 0 ? yesIndex : 0];
  const noTokenId = clobTokenIds[noIndex >= 0 ? noIndex : 1];
  const yesPrice = toGammaNumber(outcomePrices[0]);
  const noPrice = toGammaNumber(outcomePrices[noIndex >= 0 ? noIndex : 1]);
  const yesBestBid = toGammaNumber(market.bestBid);
  const yesBestAsk = toGammaNumber(market.bestAsk);
  const noBestBid =
    yesBestAsk !== undefined && yesBestAsk > 0 && yesBestAsk < 1
      ? normalizeComplementPrice(1 - yesBestAsk)
      : undefined;
  const noBestAsk =
    yesBestBid !== undefined && yesBestBid > 0 && yesBestBid < 1
      ? normalizeComplementPrice(1 - yesBestBid)
      : undefined;

  if (!yesTokenId && !noTokenId) {
    return undefined;
  }

  return {
    marketId: market.id,
    conditionId: market.conditionId,
    question: market.question,
    slug: market.slug,
    acceptingOrders: market.acceptingOrders === true,
    closed: market.closed === true,
    negRisk: market.negRisk === true,
    tickSize: normalizeTickSize(market.orderPriceMinTickSize),
    minOrderSize: firstGammaNumber(market.orderMinSize),
    tokens: {
      yes: yesTokenId
        ? {
            tokenId: yesTokenId,
            outcome: outcomes[yesIndex >= 0 ? yesIndex : 0] ?? "Yes",
            price: yesPrice,
            ...(yesBestBid !== undefined && yesBestBid > 0 ? { bestBid: yesBestBid } : {}),
            ...(yesBestAsk !== undefined && yesBestAsk > 0 ? { bestAsk: yesBestAsk } : {}),
          }
        : undefined,
      no: noTokenId
        ? {
            tokenId: noTokenId,
            outcome: outcomes[noIndex >= 0 ? noIndex : 1] ?? "No",
            price: noPrice,
            ...(noBestBid !== undefined ? { bestBid: noBestBid } : {}),
            ...(noBestAsk !== undefined ? { bestAsk: noBestAsk } : {}),
          }
        : undefined,
    },
  };
}

function normalizeComplementPrice(value: number): number | undefined {
  if (!Number.isFinite(value) || value <= 0 || value >= 1) {
    return undefined;
  }

  return value;
}

function normalizeTickSize(
  value: number | string | undefined,
): PolymarketMarketMetadata["tickSize"] {
  return normalizeMarketTickSize(value) ?? "0.01";
}
