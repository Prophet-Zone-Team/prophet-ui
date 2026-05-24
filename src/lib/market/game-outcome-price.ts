import { calculateReferencePrice, normalizeLimitPrice } from "@/lib/market/order-math";
import type {
  BidTradeSide,
  GameMarketOutcome,
  OrderOutcomeSide,
} from "@/types/market";

export function getGameOutcomeExecutablePrice(
  outcome: GameMarketOutcome | undefined,
  binarySide: OrderOutcomeSide,
  tradeSide: BidTradeSide,
): number | undefined {
  if (!outcome) {
    return undefined;
  }

  if (tradeSide === "buy") {
    return binarySide === "yes" ? outcome.yesAsk : outcome.noAsk;
  }

  return binarySide === "yes" ? outcome.yesBid : outcome.noBid;
}

export function resolveGameOutcomeTradePrice(
  outcome: GameMarketOutcome | undefined,
  probability: number,
  binarySide: OrderOutcomeSide,
  tradeSide: BidTradeSide,
): number {
  const executable = getGameOutcomeExecutablePrice(outcome, binarySide, tradeSide);

  if (executable !== undefined && Number.isFinite(executable) && executable > 0) {
    return normalizeLimitPrice(executable);
  }

  return calculateReferencePrice(probability, binarySide);
}

export function findGameMarketOutcome(
  outcomes: GameMarketOutcome[],
  side: GameMarketOutcome["side"],
): GameMarketOutcome | undefined {
  return outcomes.find((item) => item.side === side);
}
