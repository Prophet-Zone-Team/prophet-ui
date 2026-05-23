import {
  buildGameBidOrderPreview,
  getDefaultGameLimitPrice
} from "@/lib/market/game-order";
import { calculateReferencePrice } from "@/lib/market/order-math";
import { buildBidOrderPreview } from "@/lib/market/polymarket-order";
import type {
  GameMarketSnapshot,
  MatchOutcomeSide,
  OrderOutcomeSide,
  TeamMarketSnapshot
} from "@/types/market";

const DEFAULT_BID_AMOUNT = 100;

export function formatSimpleBidLabel(amount: number): string {
  return `Bid $${amount.toFixed(1)}`;
}

export function getGameSimpleBidPrice(
  snapshot: GameMarketSnapshot,
  side: MatchOutcomeSide
): number {
  const preview = buildGameBidOrderPreview({
    snapshot,
    outcomeSide: side,
    tradeSide: "buy",
    amount: DEFAULT_BID_AMOUNT,
    limitPrice: getDefaultGameLimitPrice(snapshot, side),
    orderType: "FAK"
  });

  return preview.estimatedTotalCost;
}

export function getTeamSimpleBidPrice(
  snapshot: TeamMarketSnapshot,
  side: OrderOutcomeSide
): number {
  const limitPrice =
    snapshot.market.polymarket?.tokens[side]?.price ??
    calculateReferencePrice(snapshot.market.probability, side);

  const preview = buildBidOrderPreview({
    snapshot,
    outcomeSide: side,
    tradeSide: "buy",
    amount: DEFAULT_BID_AMOUNT,
    limitPrice,
    orderType: "FAK"
  });

  return preview.estimatedTotalCost;
}

export function formatChangePillLabel(change24h?: number): string | undefined {
  if (change24h === undefined || !Number.isFinite(change24h)) {
    return undefined;
  }

  const rounded = Math.abs(Math.round(change24h));

  if (rounded === 0) {
    return undefined;
  }

  const sign = change24h >= 0 ? "+" : "-";
  return `${sign} $${rounded}`;
}
