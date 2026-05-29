import {
  firstGammaNumber,
  parseGammaArrayField,
  priceToProbability,
  toGammaNumber,
  type GammaMarketRecord,
} from "@/lib/market/polymarket-gamma";
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
          }
        : undefined,
      no: noTokenId
        ? {
            tokenId: noTokenId,
            outcome: outcomes[noIndex >= 0 ? noIndex : 1] ?? "No",
            price: toGammaNumber(outcomePrices[noIndex >= 0 ? noIndex : 1]),
          }
        : undefined,
    },
  };
}

function normalizeTickSize(
  value: number | string | undefined,
): PolymarketMarketMetadata["tickSize"] {
  const parsed = toGammaNumber(value);

  if (parsed === 0.1) {
    return "0.1";
  }

  if (parsed === 0.001) {
    return "0.001";
  }

  if (parsed === 0.0001) {
    return "0.0001";
  }

  return "0.01";
}
