import type {
  BidTradeSide,
  FixtureMarketOutcome,
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
import {
  resolveFixtureBuyAsk,
  resolveFixtureBuyAskDisabledReason,
} from "@/lib/market/fixture-ask-liquidity";

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

export function buildFixtureBidOrderPreview(input: {
  outcome: FixtureMarketOutcome;
  acceptingOrders: boolean;
  binarySide: OrderOutcomeSide;
  tradeSide: BidTradeSide;
  amount: number;
  limitPrice: number;
  orderType: TradingOrderType;
}): GameBidOrderPreview {
  const tokenId =
    input.binarySide === "yes" ? input.outcome.tokenId : input.outcome.noTokenId;
  const sidePrice = normalizeLimitPrice(input.limitPrice);
  const estimate = calculateOrderEstimate({
    side: input.binarySide,
    tradeSide: input.tradeSide,
    amount: input.amount,
    probability: input.outcome.probability,
    limitPrice: sidePrice,
    orderType: input.orderType,
    fee: input.outcome.fee
  });

  const disabledReason =
    resolveFixtureBuyAskDisabledReason(
      input.outcome,
      input.binarySide,
      input.tradeSide,
    ) ??
    getGameDisabledReason({
      acceptingOrders: input.acceptingOrders,
      amount: input.amount,
      orderType: input.orderType,
      tradeSide: input.tradeSide,
      tokenId,
    });

  const outcomeSide: MatchOutcomeSide =
    input.outcome.side === "home" ||
    input.outcome.side === "draw" ||
    input.outcome.side === "away"
      ? input.outcome.side
      : "home";

  return {
    outcomeSide,
    binarySide: input.binarySide,
    tradeSide: input.tradeSide,
    orderType: input.orderType,
    tokenId,
    acceptingOrders: input.acceptingOrders,
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

export function getDefaultFixtureLimitPrice(
  outcome: FixtureMarketOutcome,
  binarySide: OrderOutcomeSide = "yes",
  tradeSide: BidTradeSide = "buy"
): number | undefined {
  if (tradeSide === "sell") {
    if (binarySide === "yes") {
      return outcome.yesBid ?? outcome.yesAsk ?? outcome.price;
    }

    return outcome.noBid ?? outcome.noAsk ?? Math.max(0.001, 1 - outcome.price);
  }

  return resolveFixtureBuyAsk(outcome, binarySide);
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

  const disabledReason =
    getGameBuyAskDisabledReason({
      outcome,
      binarySide: input.binarySide,
      tradeSide: input.tradeSide,
    }) ??
    getGameDisabledReason({
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

function getGameBuyAskDisabledReason({
  outcome,
  binarySide,
  tradeSide,
}: {
  outcome?: Pick<FixtureMarketOutcome, "yesAsk" | "noAsk">;
  binarySide: OrderOutcomeSide;
  tradeSide: BidTradeSide;
}): string | undefined {
  if (!outcome) {
    return undefined;
  }

  return resolveFixtureBuyAskDisabledReason(outcome, binarySide, tradeSide);
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
