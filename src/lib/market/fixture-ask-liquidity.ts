import { isLimitOrderType } from "@/lib/market/order-math";
import type {
  BidTradeSide,
  FixtureMarketOutcome,
  OrderOutcomeSide,
  TradingOrderType
} from "@/types/market";

export type AskLiquidityOutcome = Partial<
  Pick<FixtureMarketOutcome, "yesAsk" | "noAsk" | "price" | "probability">
>;

export const NO_ASK_LIQUIDITY_MESSAGE =
  "No sell orders are available for this outcome. You cannot place a buy order right now.";

export function isValidAskPrice(price: number | undefined): price is number {
  return (
    price !== undefined && Number.isFinite(price) && price > 0 && price < 1
  );
}

export function resolveFixtureBuyAsk(
  outcome: Pick<FixtureMarketOutcome, "yesAsk" | "noAsk">,
  binarySide: OrderOutcomeSide
): number | undefined {
  const ask = binarySide === "yes" ? outcome.yesAsk : outcome.noAsk;

  return isValidAskPrice(ask) ? ask : undefined;
}

function probabilityToAskPrice(
  probability: number | undefined
): number | undefined {
  if (probability === undefined || !Number.isFinite(probability)) {
    return undefined;
  }

  const price = probability / 100;
  return isValidAskPrice(price) ? price : undefined;
}

/** Buy-side display/trade ask with snapshot probability fallback when CLOB asks are missing. */
export function resolveFixtureDisplayAskPrice(
  outcome: AskLiquidityOutcome,
  binarySide: OrderOutcomeSide = "yes"
): number | undefined {
  const ask = resolveFixtureBuyAsk(outcome, binarySide);

  if (ask !== undefined) {
    return ask;
  }

  if (binarySide === "yes") {
    if (isValidAskPrice(outcome.price)) {
      return outcome.price;
    }

    return probabilityToAskPrice(outcome.probability);
  }

  if (isValidAskPrice(outcome.price)) {
    const noPrice = 1 - outcome.price;
    return isValidAskPrice(noPrice) ? noPrice : undefined;
  }

  if (outcome.probability !== undefined) {
    return probabilityToAskPrice(100 - outcome.probability);
  }

  return undefined;
}

/** Whether an outcome button can be selected in the markets UI. */
export function isFixtureOutcomeSelectable(
  outcome: Pick<FixtureMarketOutcome, "tokenId"> & AskLiquidityOutcome,
  binarySide: OrderOutcomeSide = "yes"
): boolean {
  if (!outcome.tokenId) {
    return false;
  }

  return resolveFixtureDisplayAskPrice(outcome, binarySide) !== undefined;
}

export function hasFixtureBuyAsk(
  outcome: Pick<FixtureMarketOutcome, "yesAsk" | "noAsk">,
  binarySide: OrderOutcomeSide
): boolean {
  return resolveFixtureBuyAsk(outcome, binarySide) !== undefined;
}

export function resolveFixtureBuyAskDisabledReason(
  outcome: AskLiquidityOutcome,
  binarySide: OrderOutcomeSide,
  tradeSide: BidTradeSide,
  orderType?: TradingOrderType
): string | undefined {
  if (tradeSide !== "buy") {
    return undefined;
  }

  if (orderType && isLimitOrderType(orderType)) {
    return undefined;
  }

  if (hasFixtureBuyAsk(outcome, binarySide)) {
    return undefined;
  }

  if (resolveFixtureDisplayAskPrice(outcome, binarySide) !== undefined) {
    return undefined;
  }

  return NO_ASK_LIQUIDITY_MESSAGE;
}

function resolveMergedLiveAsk(
  liveAsk: number | undefined,
  snapshotAsk: number | undefined
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
    | undefined
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
    price: isValidAskPrice(yesAsk) ? yesAsk : outcome.price
  };
}

export type FixtureOutcomeLiveAsks = {
  yesAsk?: number;
  noAsk?: number;
  yesBid?: number;
  noBid?: number;
};

export function collectFixtureOutcomeWsTokenIds(
  outcome: Pick<FixtureMarketOutcome, "tokenId" | "noTokenId"> | null | undefined,
): string[] {
  if (!outcome) {
    return [];
  }

  return [outcome.tokenId, outcome.noTokenId].filter((id): id is string =>
    Boolean(id),
  );
}

export function resolveOutcomeLiveAsksFromTokenPrices(
  outcome: Pick<FixtureMarketOutcome, "tokenId" | "noTokenId">,
  tokenPrices: Record<
    string,
    { bestAsk?: number; bestBid?: number } | undefined
  >,
): FixtureOutcomeLiveAsks | undefined {
  const yesPrices = outcome.tokenId
    ? tokenPrices[outcome.tokenId]
    : undefined;
  const noPrices = outcome.noTokenId
    ? tokenPrices[outcome.noTokenId]
    : undefined;
  const yesAsk = yesPrices?.bestAsk;
  const noAsk = noPrices?.bestAsk;
  const yesBid = yesPrices?.bestBid;
  const noBid = noPrices?.bestBid;

  if (
    yesAsk === undefined &&
    noAsk === undefined &&
    yesBid === undefined &&
    noBid === undefined
  ) {
    return undefined;
  }

  return { yesAsk, noAsk, yesBid, noBid };
}
