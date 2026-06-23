import { fetchProphetComboMarkets } from "@/lib/combo/fetch-prophet-combo-markets";
import { resolveComboLegOutcomeSide } from "@/lib/combo/combo-pick-outcome";
import { resolveMarketOrderWorstPrice } from "@/lib/market/order-math";
import type {
  ComboMarketRecord,
  ComboMarketsDay,
  ComboMarketsResponse,
  ComboOutcomeSide,
  ComboTicketLeg,
} from "@/types/combo";
import type { ComboPick } from "@/views/combo/combo-widget/types";

export interface FetchComboMarketsOptions {
  limit?: number;
  cursor?: string;
  exclude?: string[];
  timezone?: string;
  day?: ComboMarketsDay;
  signal?: AbortSignal;
}

export async function fetchComboMarkets(
  options: FetchComboMarketsOptions = {},
): Promise<ComboMarketsResponse> {
  return fetchProphetComboMarkets(options);
}

export function resolveLegPositionId(
  market: ComboMarketRecord,
  outcomeSide: ComboOutcomeSide,
): string {
  return outcomeSide === "yes" ? market.positionIds[0] : market.positionIds[1];
}

export function resolveReferencePrice(
  market: ComboMarketRecord,
  outcomeSide: ComboOutcomeSide,
): number {
  const raw = outcomeSide === "yes" ? market.outcomePrices[0] : market.outcomePrices[1];
  const parsed = Number.parseFloat(raw);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

/** Local buy-side estimate from catalog mid price before RFQ WS quote is available. */
export function resolveComboLegBuyPrice(
  market: ComboMarketRecord,
  outcomeSide: ComboOutcomeSide,
): number {
  const sidePrice = resolveReferencePrice(market, outcomeSide);

  if (sidePrice <= 0) {
    return 0;
  }

  return resolveMarketOrderWorstPrice({
    tradeSide: "buy",
    sidePrice,
  });
}

export function buildComboLegsFromPicks(
  picks: ComboPick[],
  markets: ComboMarketRecord[],
): ComboTicketLeg[] {
  const marketsById = new Map(markets.map((market) => [market.id, market]));

  return picks
    .map((pick) => {
      const market = marketsById.get(pick.id);

      if (market && pick.type === "moneyline") {
        const outcomeSide = resolveComboLegOutcomeSide(market, pick.outcomeSide);

        return buildComboTicketLeg({
          id: pick.id,
          market,
          outcomeSide,
        });
      }

      if (market && pick.type === "spread") {
        return buildComboTicketLeg({
          id: pick.id,
          market,
          outcomeSide: "yes",
        });
      }

      if (market && pick.type === "total") {
        return buildComboTicketLeg({
          id: pick.id,
          market,
          outcomeSide: pick.outcomeSide,
        });
      }

      return comboPickToTicketLeg(pick);
    })
    .filter((leg): leg is ComboTicketLeg => Boolean(leg));
}

export function buildComboTicketLeg(input: {
  id: string;
  market: ComboMarketRecord;
  outcomeSide: ComboOutcomeSide;
}): ComboTicketLeg {
  return {
    id: input.id,
    legPositionId: resolveLegPositionId(input.market, input.outcomeSide),
    outcomeSide: input.outcomeSide,
    referencePrice: resolveReferencePrice(input.market, input.outcomeSide),
  };
}

export function comboPickToTicketLeg(pick: {
  id: string;
  legPositionId?: string;
  referencePrice?: number;
  outcomeSide?: ComboOutcomeSide;
  type: string;
}): ComboTicketLeg | undefined {
  if (!pick.legPositionId) {
    return undefined;
  }

  const referencePrice =
    typeof pick.referencePrice === "number" && pick.referencePrice > 0
      ? pick.referencePrice
      : 0;

  return {
    id: pick.id,
    legPositionId: pick.legPositionId,
    outcomeSide:
      (pick.type === "moneyline" || pick.type === "total") && pick.outcomeSide
        ? pick.outcomeSide
        : "yes",
    referencePrice,
  };
}
