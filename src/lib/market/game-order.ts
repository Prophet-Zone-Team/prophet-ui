import type {
  BidTradeSide,
  GameMarketSnapshot,
  MatchOutcomeSide,
  OrderOutcomeSide,
  TradingOrderType
} from "@/types/market";
import { getOutcomeProbability } from "@/lib/market/game-market-snapshot";
import {
  findGameMarketOutcome,
  resolveGameOutcomeTradePrice
} from "@/lib/market/game-outcome-price";
import {
  calculateOrderEstimate,
  normalizeLimitPrice,
  validateOrderAmount
} from "@/lib/market/order-math";

export interface GameBidOrderPreviewInput {
  snapshot: GameMarketSnapshot;
  outcomeSide: MatchOutcomeSide;
  binarySide: OrderOutcomeSide;
  tradeSide: BidTradeSide;
  amount: number;
  limitPrice: number;
  orderType: TradingOrderType;
}

export interface GameBidOrderPreview {
  outcomeSide: MatchOutcomeSide;
  binarySide: OrderOutcomeSide;
  tradeSide: BidTradeSide;
  orderType: TradingOrderType;
  tokenId?: string;
  acceptingOrders: boolean;
  sidePrice: number;
  shareSize: number;
  inputAmount: number;
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
  const outcome = findGameMarketOutcome(input.snapshot.outcomes, input.outcomeSide);
  const probability =
    outcome?.probability ?? getOutcomeProbability(input.snapshot, input.outcomeSide);
  const tokenId =
    input.binarySide === "yes" ? outcome?.tokenId : outcome?.noTokenId;
  const sidePrice = normalizeLimitPrice(input.limitPrice);
  const estimate = calculateOrderEstimate({
    side: input.binarySide,
    tradeSide: input.tradeSide,
    amount: input.amount,
    probability,
    limitPrice: sidePrice,
    orderType: input.orderType,
    fee: outcome?.fee
  });

  const disabledReason = getGameDisabledReason({
    acceptingOrders: input.snapshot.market.acceptingOrders,
    amount: input.amount,
    orderType: input.orderType,
    tradeSide: input.tradeSide,
    tokenId
  });

  return {
    outcomeSide: input.outcomeSide,
    binarySide: input.binarySide,
    tradeSide: input.tradeSide,
    orderType: input.orderType,
    tokenId,
    acceptingOrders: input.snapshot.market.acceptingOrders,
    sidePrice,
    shareSize: estimate.shareSize,
    inputAmount: input.amount,
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
  orderType,
  tradeSide,
  tokenId
}: {
  acceptingOrders: boolean;
  amount: number;
  orderType: TradingOrderType;
  tradeSide: BidTradeSide;
  tokenId?: string;
}): string | undefined {
  if (!tokenId) {
    return "Match markets are preview-only until a Polymarket fixture market is linked.";
  }

  if (!acceptingOrders) {
    return "This match market is not accepting orders.";
  }

  return validateOrderAmount({
    amount,
    orderType,
    tradeSide
  });
}

export function getDefaultGameLimitPrice(
  snapshot: GameMarketSnapshot,
  outcomeSide: MatchOutcomeSide,
  binarySide: OrderOutcomeSide = "yes",
  tradeSide: BidTradeSide = "buy"
): number {
  const outcome = findGameMarketOutcome(snapshot.outcomes, outcomeSide);
  const probability = getOutcomeProbability(snapshot, outcomeSide);

  return resolveGameOutcomeTradePrice(
    outcome,
    probability,
    binarySide,
    tradeSide
  );
}
