import type { BidTradeSide, OrderOutcomeSide, PolymarketFeeDetails, TradingOrderType } from "../../types/market";
import {
  calculateBuyOrderCostFromBudget,
  estimateBuyTakerFee,
} from "./polymarketFees";

const MIN_PRICE = 0.01;
const MAX_PRICE = 0.99;

export interface OrderEstimateInput {
  side: OrderOutcomeSide;
  tradeSide?: BidTradeSide;
  amount: number;
  probability: number;
  limitPrice?: number;
  orderType: TradingOrderType;
  fee?: PolymarketFeeDetails;
}

export interface OrderEstimate {
  sidePrice: number;
  shareSize: number;
  orderCost: number;
  estimatedCost: number;
  estimatedTakerFee: number;
  estimatedTotalCost: number;
  potentialPayout: number;
  potentialOutcome: number;
}

export function calculatePotentialPayout(stake: number, probability: number): number {
  if (stake <= 0 || probability <= 0) {
    return 0;
  }

  return roundMoney(stake / (probability / 100));
}

export function calculateReferencePrice(probability: number, side: OrderOutcomeSide): number {
  const normalizedProbability = clamp(probability / 100, MIN_PRICE, MAX_PRICE);

  return side === "yes" ? roundPrice(normalizedProbability) : roundPrice(1 - normalizedProbability);
}

export function calculateOutcomeReferencePrice(probability: number, side: OrderOutcomeSide): number {
  return calculateReferencePrice(probability, side);
}

export function normalizeLimitPrice(price: number): number {
  if (!Number.isFinite(price)) {
    return MIN_PRICE;
  }

  return roundPrice(clamp(price, MIN_PRICE, MAX_PRICE));
}

export function calculateOrderEstimate(input: OrderEstimateInput): OrderEstimate {
  const sidePrice = normalizeLimitPrice(input.limitPrice ?? calculateReferencePrice(input.probability, input.side));
  const requestedAmount = roundMoney(Math.max(0, input.amount));
  const tradeSide = input.tradeSide ?? "buy";
  const orderCost =
    tradeSide === "buy"
      ? calculateBuyOrderCostFromBudget({
          budget: requestedAmount,
          price: sidePrice,
          fee: input.fee,
        })
      : requestedAmount;
  const estimatedTakerFee =
    tradeSide === "buy"
      ? estimateBuyTakerFee({
          orderCost,
          price: sidePrice,
          fee: input.fee,
        })
      : 0;
  const estimatedTotalCost = tradeSide === "buy" ? roundMoney(orderCost + estimatedTakerFee) : orderCost;
  const shareSize = tradeSide === "buy" && sidePrice > 0 ? roundShares(orderCost / sidePrice) : roundShares(orderCost);
  const potentialPayout = tradeSide === "buy" ? roundMoney(shareSize) : roundMoney(shareSize * sidePrice);

  return {
    sidePrice,
    shareSize,
    orderCost,
    estimatedCost: orderCost,
    estimatedTakerFee,
    estimatedTotalCost,
    potentialPayout,
    potentialOutcome: roundMoney(potentialPayout - estimatedTotalCost),
  };
}

export function formatPriceCents(price: number): string {
  return `${(normalizeLimitPrice(price) * 100).toFixed(1)}c`;
}

export function formatShareSize(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 4,
  }).format(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function roundPrice(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundShares(value: number): number {
  return Math.round(value * 10000) / 10000;
}
