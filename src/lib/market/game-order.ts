import type {
  BidTradeSide,
  GameMarketSnapshot,
  MatchOutcomeSide,
  TradingOrderType
} from "../../types/market";
import { getOutcomeProbability } from "./game-market-snapshot";
import { calculateOrderEstimate, normalizeLimitPrice } from "./order-math";

export interface GameBidOrderPreviewInput {
  snapshot: GameMarketSnapshot;
  outcomeSide: MatchOutcomeSide;
  tradeSide: BidTradeSide;
  amount: number;
  limitPrice: number;
  orderType: TradingOrderType;
}

export interface GameBidOrderPreview {
  outcomeSide: MatchOutcomeSide;
  tradeSide: BidTradeSide;
  orderType: TradingOrderType;
  tokenId?: string;
  acceptingOrders: boolean;
  sidePrice: number;
  shareSize: number;
  estimatedCost: number;
  estimatedTakerFee: number;
  estimatedTotalCost: number;
  potentialPayout: number;
  potentialOutcome: number;
  canSubmitRealOrder: boolean;
  disabledReason?: string;
}

export function buildGameBidOrderPreview(
  input: GameBidOrderPreviewInput
): GameBidOrderPreview {
  const outcome = input.snapshot.outcomes.find((item) => item.side === input.outcomeSide);
  const probability = outcome?.probability ?? getOutcomeProbability(input.snapshot, input.outcomeSide);
  const sidePrice = normalizeLimitPrice(input.limitPrice);
  const estimate = calculateOrderEstimate({
    side: "yes",
    tradeSide: input.tradeSide,
    amount: input.amount,
    probability,
    limitPrice: sidePrice,
    orderType: input.orderType
  });

  const disabledReason = getGameDisabledReason({
    acceptingOrders: input.snapshot.market.acceptingOrders,
    amount: input.amount,
    tokenId: outcome?.tokenId
  });

  return {
    outcomeSide: input.outcomeSide,
    tradeSide: input.tradeSide,
    orderType: input.orderType,
    tokenId: outcome?.tokenId,
    acceptingOrders: input.snapshot.market.acceptingOrders,
    sidePrice,
    shareSize: estimate.shareSize,
    estimatedCost: estimate.estimatedCost,
    estimatedTakerFee: estimate.estimatedTakerFee,
    estimatedTotalCost: estimate.estimatedTotalCost,
    potentialPayout: estimate.potentialPayout,
    potentialOutcome: estimate.potentialOutcome,
    canSubmitRealOrder: !disabledReason,
    disabledReason
  };
}

function getGameDisabledReason({
  acceptingOrders,
  amount,
  tokenId
}: {
  acceptingOrders: boolean;
  amount: number;
  tokenId?: string;
}): string | undefined {
  if (!tokenId) {
    return "Match markets are preview-only until a Polymarket fixture market is linked.";
  }

  if (!acceptingOrders) {
    return "This match market is not accepting orders.";
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return "Enter a positive amount.";
  }

  return undefined;
}

export function getDefaultGameLimitPrice(
  snapshot: GameMarketSnapshot,
  outcomeSide: MatchOutcomeSide
): number {
  const probability = getOutcomeProbability(snapshot, outcomeSide);
  return normalizeLimitPrice(probability / 100);
}
