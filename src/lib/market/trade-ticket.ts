import { resolveFixtureDisplayAskPrice } from "@/lib/market/fixture-ask-liquidity";
import {
  findFixtureMarketOutcome,
  resolveDefaultFixtureOutcome,
} from "@/lib/market/fixture-markets-mapper";
import { getOutcomeProbability } from "@/lib/market/game-market-snapshot";
import {
  findGameMarketOutcome,
  resolveGameOutcomeTradePrice
} from "@/lib/market/game-outcome-price";
import { calculateReferencePrice } from "@/lib/market/order-math";
import {
  isGameClosedForTrading,
  resolveEffectiveAcceptingOrders,
} from "@/lib/market/trading-market-status";
import type {
  BidTradeSide,
  FixtureMarketOutcome,
  GameFixtureMarketsSnapshot,
  GameMarketSnapshot,
  MatchOutcomeSide,
  OrderOutcomeSide,
  PolymarketFixtureMarketsData,
  TeamMarketSnapshot
} from "@/types/market";

function toFixtureMarketsData(
  snapshot:
    | GameFixtureMarketsSnapshot
    | PolymarketFixtureMarketsData
    | undefined,
): PolymarketFixtureMarketsData | undefined {
  if (!snapshot) {
    return undefined;
  }

  return {
    lines: snapshot.lines,
    exactScores: snapshot.exactScores,
    halftime: snapshot.halftime,
  };
}

/** Re-resolve a stored fixture outcome against the latest markets snapshot. */
export function resolveFreshFixtureOutcome(
  selected: FixtureMarketOutcome | null | undefined,
  fixtureMarkets:
    | GameFixtureMarketsSnapshot
    | PolymarketFixtureMarketsData
    | undefined,
): FixtureMarketOutcome | undefined {
  if (!selected) {
    return undefined;
  }

  const data = toFixtureMarketsData(fixtureMarkets);

  if (!data) {
    return selected;
  }

  return findFixtureMarketOutcome(data, selected.id) ?? selected;
}

export function resolveGameDefaultFixtureOutcome(
  snapshot: GameMarketSnapshot,
  fixtureMarkets?: GameFixtureMarketsSnapshot,
): FixtureMarketOutcome | undefined {
  return (
    resolveDefaultFixtureOutcome(snapshot.match.polymarket?.fixtureMarkets) ??
    resolveDefaultFixtureOutcome(toFixtureMarketsData(fixtureMarkets))
  );
}

export function isGameFixtureOutcomeBidReady(
  outcome: FixtureMarketOutcome,
  snapshot: GameMarketSnapshot,
  binarySide: OrderOutcomeSide = "yes"
): boolean {
  if (isGameClosedForTrading(snapshot.match, snapshot.market.closed)) {
    return false;
  }

  const acceptingOrders = resolveEffectiveAcceptingOrders(
    outcome.acceptingOrders ?? snapshot.market.acceptingOrders,
    snapshot.market.closed,
  );

  if (!acceptingOrders || !outcome.tokenId) {
    return false;
  }

  return resolveFixtureDisplayAskPrice(outcome, binarySide) !== undefined;
}

export function isGameMoneylineBidReady(snapshot: GameMarketSnapshot): boolean {
  if (isGameClosedForTrading(snapshot.match, snapshot.market.closed)) {
    return false;
  }

  if (!snapshot.market.acceptingOrders) {
    return false;
  }

  return snapshot.outcomes.some((outcome) => Boolean(outcome.tokenId));
}

export function shouldDefaultGameMarketOrder(
  snapshot: GameMarketSnapshot,
  outcome?: FixtureMarketOutcome,
  binarySide: OrderOutcomeSide = "yes"
): boolean {
  if (outcome) {
    return isGameFixtureOutcomeBidReady(outcome, snapshot, binarySide);
  }

  return isGameMoneylineBidReady(snapshot);
}

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
