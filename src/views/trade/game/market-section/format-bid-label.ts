import {
  buildGameBidOrderPreview,
  getDefaultGameLimitPrice
} from "@/lib/market/game-order";
import { getOutcomeProbability } from "@/lib/market/game-market-snapshot";
import {
  findGameMarketOutcome,
  resolveGameOutcomeTradePrice
} from "@/lib/market/game-outcome-price";
import {
  calculateReferencePrice,
  formatOrderbookPrice
} from "@/lib/market/order-math";
import { buildBidOrderPreview } from "@/lib/market/polymarket-order";
import type {
  GameMarketSnapshot,
  MatchOutcomeSide,
  OrderOutcomeSide,
  TeamMarketSnapshot
} from "@/types/market";

const DEFAULT_BID_AMOUNT = 100;

export function getGameSidePrice(
  snapshot: GameMarketSnapshot,
  side: MatchOutcomeSide,
  binarySide: OrderOutcomeSide = "yes"
): number {
  const outcome = findGameMarketOutcome(snapshot.outcomes, side);
  const probability = getOutcomeProbability(snapshot, side);

  return resolveGameOutcomeTradePrice(outcome, probability, binarySide, "buy");
}

export function getGameSimpleBidPrice(
  snapshot: GameMarketSnapshot,
  side: MatchOutcomeSide
): number {
  const preview = buildGameBidOrderPreview({
    snapshot,
    outcomeSide: side,
    binarySide: "yes",
    tradeSide: "buy",
    amount: DEFAULT_BID_AMOUNT,
    limitPrice: getDefaultGameLimitPrice(snapshot, side, "yes", "buy"),
    orderType: "FAK"
  });

  return preview.estimatedTotalCost;
}

export function getTeamSimpleSidePrice(
  snapshot: TeamMarketSnapshot,
  side: OrderOutcomeSide
): number {
  return (
    snapshot.market.polymarket?.tokens[side]?.price ??
    calculateReferencePrice(snapshot.market.probability, side)
  );
}

export function getTeamSimpleBidPrice(
  snapshot: TeamMarketSnapshot,
  side: OrderOutcomeSide
): number {
  const preview = buildBidOrderPreview({
    snapshot,
    outcomeSide: side,
    tradeSide: "buy",
    amount: DEFAULT_BID_AMOUNT,
    limitPrice: getTeamSimpleSidePrice(snapshot, side),
    orderType: "FAK"
  });

  return preview.estimatedTotalCost;
}

export function formatSimpleOutcomeBidLabel(
  side: OrderOutcomeSide,
  price: number
): string {
  const sideLabel = side === "yes" ? "Yes" : "No";
  return `${sideLabel} ${formatOrderbookPrice(price)}`;
}

export function formatGameMatchBidLabel(label: string, price: number): string {
  return `${label} ${formatOrderbookPrice(price)}`;
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
