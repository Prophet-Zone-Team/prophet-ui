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

function resolveMergedLiveAsk(
  liveAsk: number | undefined,
  snapshotAsk: number | undefined,
): number | undefined {
  return isValidAskPrice(liveAsk) ? liveAsk : snapshotAsk;
}

export function mergeFixtureOutcomeLiveAsks(
  outcome: FixtureMarketOutcome,
  liveAsks:
    | {
        yesAsk?: number;
        noAsk?: number;
        yesBid?: number;
        noBid?: number;
      }
    | undefined,
): FixtureMarketOutcome {
  if (liveAsks === undefined) {
    return outcome;
  }

  const yesAsk = resolveMergedLiveAsk(liveAsks.yesAsk, outcome.yesAsk);
  const noAsk = resolveMergedLiveAsk(liveAsks.noAsk, outcome.noAsk);
  const yesBid =
    liveAsks.yesBid !== undefined ? liveAsks.yesBid : outcome.yesBid;
  const noBid = liveAsks.noBid !== undefined ? liveAsks.noBid : outcome.noBid;

  return {
    ...outcome,
    yesAsk,
    noAsk,
    yesBid,
    noBid,
    price: isValidAskPrice(yesAsk) ? yesAsk : outcome.price,
  };
}
