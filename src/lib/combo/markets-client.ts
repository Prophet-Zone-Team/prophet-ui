import type {
  ComboMarketRecord,
  ComboMarketsResponse,
  ComboOutcomeSide,
  ComboTicketLeg,
} from "@/types/combo";
import { mockComboMarkets } from "@/data/mock/combo-markets";

export interface FetchComboMarketsOptions {
  limit?: number;
  cursor?: string;
  exclude?: string[];
  signal?: AbortSignal;
}

export async function fetchComboMarkets(
  options: FetchComboMarketsOptions = {},
): Promise<ComboMarketsResponse> {
  if (options.signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  const limit = Math.max(1, options.limit ?? 50);
  const exclude = new Set(options.exclude ?? []);
  const filtered = mockComboMarkets.filter(
    (market) => !exclude.has(market.conditionId),
  );

  const startIndex = options.cursor
    ? Math.max(0, Number.parseInt(options.cursor, 10) || 0)
    : 0;
  const page = filtered.slice(startIndex, startIndex + limit);
  const nextIndex = startIndex + page.length;
  const hasMore = nextIndex < filtered.length;

  return {
    markets: page,
    nextCursor: hasMore ? String(nextIndex) : null,
  };
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
      pick.type === "moneyline" && pick.outcomeSide ? pick.outcomeSide : "yes",
    referencePrice,
  };
}
