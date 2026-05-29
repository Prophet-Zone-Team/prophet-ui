import type { WorldCupMatch } from "@/types/market";

export const CLOSED_MARKET_DISABLED_REASON =
  "This Polymarket market is closed.";

export function isMarketClosedForTrading(closed?: boolean): boolean {
  return closed === true;
}

export function isGameClosedForTrading(
  match: WorldCupMatch,
  marketClosed?: boolean,
): boolean {
  return isMarketClosedForTrading(marketClosed) || match.status === "finished";
}

export function resolveEffectiveAcceptingOrders(
  acceptingOrders: boolean,
  closed?: boolean,
): boolean {
  if (isMarketClosedForTrading(closed)) {
    return false;
  }

  return acceptingOrders;
}

export function getClosedMarketDisabledReason(input: {
  closed?: boolean;
  match?: WorldCupMatch;
}): string | undefined {
  if (isMarketClosedForTrading(input.closed)) {
    return CLOSED_MARKET_DISABLED_REASON;
  }

  if (input.match?.status === "finished") {
    return CLOSED_MARKET_DISABLED_REASON;
  }

  return undefined;
}
