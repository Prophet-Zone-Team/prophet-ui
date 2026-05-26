import type {
  BidTradeSide,
  FixtureMarketOutcome,
  OrderOutcomeSide,
} from "@/types/market";

export const NO_ASK_LIQUIDITY_MESSAGE =
  "No sell orders are available for this outcome. You cannot place a buy order right now.";

export function isValidAskPrice(price: number | undefined): price is number {
  return price !== undefined && Number.isFinite(price) && price > 0 && price < 1;
}

export function resolveFixtureBuyAsk(
  outcome: Pick<FixtureMarketOutcome, "yesAsk" | "noAsk">,
  binarySide: OrderOutcomeSide,
): number | undefined {
  const ask = binarySide === "yes" ? outcome.yesAsk : outcome.noAsk;

  return isValidAskPrice(ask) ? ask : undefined;
}

export function hasFixtureBuyAsk(
  outcome: Pick<FixtureMarketOutcome, "yesAsk" | "noAsk">,
  binarySide: OrderOutcomeSide,
): boolean {
  return resolveFixtureBuyAsk(outcome, binarySide) !== undefined;
}

export function resolveFixtureBuyAskDisabledReason(
  outcome: Pick<FixtureMarketOutcome, "yesAsk" | "noAsk">,
  binarySide: OrderOutcomeSide,
  tradeSide: BidTradeSide,
): string | undefined {
  if (tradeSide !== "buy") {
    return undefined;
  }

  return hasFixtureBuyAsk(outcome, binarySide)
    ? undefined
    : NO_ASK_LIQUIDITY_MESSAGE;
}

export function mergeFixtureOutcomeLiveAsks(
  outcome: FixtureMarketOutcome,
  liveAsks: { yesAsk?: number; noAsk?: number } | undefined,
): FixtureMarketOutcome {
  if (liveAsks === undefined) {
    return outcome;
  }

  return {
    ...outcome,
    yesAsk: liveAsks.yesAsk,
    noAsk: liveAsks.noAsk,
    price: isValidAskPrice(liveAsks.yesAsk) ? liveAsks.yesAsk : outcome.price,
  };
}
