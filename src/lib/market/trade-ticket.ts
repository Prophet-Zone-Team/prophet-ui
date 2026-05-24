import { getOutcomeProbability } from "@/lib/market/game-market-snapshot";
import {
  findGameMarketOutcome,
  resolveGameOutcomeTradePrice
} from "@/lib/market/game-outcome-price";
import { calculateReferencePrice } from "@/lib/market/order-math";
import type {
  BidTradeSide,
  GameMarketSnapshot,
  MatchOutcomeSide,
  OrderOutcomeSide,
  TeamMarketSnapshot
} from "@/types/market";

export function getDefaultTradeLimitPrice(
  snapshot: TeamMarketSnapshot,
  outcomeSide: OrderOutcomeSide
): number {
  return (
    snapshot.market.polymarket?.tokens[outcomeSide]?.price ??
    calculateReferencePrice(snapshot.market.probability, outcomeSide)
  );
}

export function formatDefaultTradeLimitPrice(
  snapshot: TeamMarketSnapshot,
  outcomeSide: OrderOutcomeSide
): string {
  return getDefaultTradeLimitPrice(snapshot, outcomeSide).toFixed(3);
}

export function getDefaultGameTradeLimitPrice(
  snapshot: GameMarketSnapshot,
  matchOutcomeSide: MatchOutcomeSide,
  binarySide: OrderOutcomeSide,
  tradeSide: BidTradeSide = "buy"
): number {
  const outcome = findGameMarketOutcome(snapshot.outcomes, matchOutcomeSide);
  const probability = getOutcomeProbability(snapshot, matchOutcomeSide);

  return resolveGameOutcomeTradePrice(
    outcome,
    probability,
    binarySide,
    tradeSide
  );
}

export function formatDefaultGameTradeLimitPrice(
  snapshot: GameMarketSnapshot,
  matchOutcomeSide: MatchOutcomeSide,
  binarySide: OrderOutcomeSide,
  tradeSide: BidTradeSide = "buy"
): string {
  return getDefaultGameTradeLimitPrice(
    snapshot,
    matchOutcomeSide,
    binarySide,
    tradeSide
  ).toFixed(3);
}
