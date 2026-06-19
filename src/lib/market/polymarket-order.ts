import type { BidTradeSide, OrderOutcomeSide, TeamMarketSnapshot, TradingOrderType } from "@/types/market";
import {
  calculateOrderEstimate,
  normalizeLimitPrice,
  validateOrderAmount
} from "@/lib/market/order-math";
import { getClosedMarketDisabledReason } from "@/lib/market/trading-market-status";

type PolymarketTickSize = NonNullable<TeamMarketSnapshot["market"]["polymarket"]>["tickSize"];

export interface BidOrderPreviewInput {
  snapshot: TeamMarketSnapshot;
  outcomeSide: OrderOutcomeSide;
  tradeSide: BidTradeSide;
  amount: number;
  limitPrice: number;
  orderType: TradingOrderType;
  /** When selling an existing position, use the held outcome token id. */
  tokenId?: string;
  maxShareSize?: number;
  /** Live or position-specific market status; overrides cached snapshot metadata. */
  acceptingOrders?: boolean;
}

export interface BidOrderPreview {
  outcomeSide: OrderOutcomeSide;
  tradeSide: BidTradeSide;
  orderType: TradingOrderType;
  tokenId?: string;
  tickSize?: PolymarketTickSize;
  negRisk?: boolean;
  acceptingOrders: boolean;
  minOrderSize?: number;
  sidePrice: number;
  shareSize: number;
  /** User-entered budget/share amount before fee-adjusted order notional. */
  inputAmount: number;
  estimatedCost: number;
  estimatedTakerFee: number;
  estimatedTotalCost: number;
  potentialPayout: number;
  potentialOutcome: number;
  canSubmitRealOrder: boolean;
  disabledReason?: string;
}

export function buildBidOrderPreview(input: BidOrderPreviewInput): BidOrderPreview {
  const token = input.snapshot.market.polymarket?.tokens[input.outcomeSide];
  const metadata = input.snapshot.market.polymarket;
  const tokenId = input.tokenId ?? token?.tokenId;
  const sidePrice = normalizeLimitPrice(input.limitPrice);
  const estimate = calculateOrderEstimate({
    side: input.outcomeSide,
    tradeSide: input.tradeSide,
    amount: input.amount,
    probability: input.snapshot.market.probability,
    limitPrice: sidePrice,
    orderType: input.orderType,
    fee: metadata?.fee,
    maxShareSize: input.maxShareSize,
  });
  const acceptingOrders =
    input.acceptingOrders ?? metadata?.acceptingOrders;
  const disabledReason =
    getClosedMarketDisabledReason({ closed: metadata?.closed }) ??
    getDisabledReason({
      acceptingOrders,
      amount: input.amount,
      shareSize: estimate.shareSize,
      minOrderSize: metadata?.minOrderSize,
      orderType: input.orderType,
      tradeSide: input.tradeSide,
      tokenId
    });

  return {
    outcomeSide: input.outcomeSide,
    tradeSide: input.tradeSide,
    orderType: input.orderType,
    tokenId,
    tickSize: metadata?.tickSize,
    negRisk: metadata?.negRisk,
    acceptingOrders: acceptingOrders === true,
    minOrderSize: metadata?.minOrderSize,
    sidePrice,
    shareSize: estimate.shareSize,
    inputAmount: input.amount,
    estimatedCost: estimate.estimatedCost,
    estimatedTakerFee: estimate.estimatedTakerFee,
    estimatedTotalCost: estimate.estimatedTotalCost,
    potentialPayout: estimate.potentialPayout,
    potentialOutcome: estimate.potentialOutcome,
    canSubmitRealOrder: !disabledReason,
    disabledReason,
  };
}

function getDisabledReason({
  acceptingOrders,
  amount,
  shareSize,
  minOrderSize,
  orderType,
  tradeSide,
  tokenId
}: {
  acceptingOrders?: boolean;
  amount: number;
  shareSize: number;
  minOrderSize?: number;
  orderType: TradingOrderType;
  tradeSide: BidTradeSide;
  tokenId?: string;
}): string | undefined {
  if (!tokenId) {
    return "No Polymarket token ID is available for this outcome.";
  }

  if (acceptingOrders === false) {
    return "This Polymarket market is not accepting orders.";
  }

  if (acceptingOrders !== true && tradeSide === "buy") {
    return "This Polymarket market is not accepting orders.";
  }

  return validateOrderAmount({
    amount,
    shareSize,
    orderType,
    tradeSide,
    minOrderSize
  });
}
