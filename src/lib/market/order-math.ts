import type { BidTradeSide, OrderOutcomeSide, PolymarketFeeDetails, TradingOrderType } from "@/types/market";
import {
  calculateBuyOrderCostFromBudget,
  estimateBuyTakerFee,
} from "@/lib/market/polymarket-fees";

const MIN_PRICE = 0.01;
const MAX_PRICE = 0.99;

export const LIMIT_BUY_MIN_SHARES = 5;

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
  const tradeSide = input.tradeSide ?? "buy";
  const isLimitOrder = input.orderType === "GTC";

  if (isLimitOrder) {
    const shareSize = roundShares(Math.max(0, input.amount));
    const orderCost = roundMoney(shareSize * sidePrice);
    const estimatedTakerFee = 0;
    const estimatedTotalCost = orderCost;
    const potentialPayout =
      tradeSide === "buy" ? roundMoney(shareSize) : roundMoney(shareSize * sidePrice);

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

  const requestedAmount = roundMoney(Math.max(0, input.amount));
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

/** Limit price stored on 0–1 scale, displayed as cents (e.g. 0.50 → "50"). */
export function formatLimitPriceInputValue(price: string | number): string {
  const numeric = typeof price === "string" ? Number(price) : price;

  if (!Number.isFinite(numeric)) {
    return "";
  }

  const cents = normalizeLimitPrice(numeric) * 100;

  return Number.isInteger(cents) ? String(cents) : cents.toFixed(1);
}

/** Parse cents-denominated limit price input back to 0–1 scale string. */
export function parseLimitPriceDisplayValue(
  displayValue: string,
  fallback: number
): string {
  const trimmed = displayValue.trim();

  if (!trimmed) {
    return normalizeLimitPrice(fallback).toFixed(3);
  }

  const cents = Number(trimmed);

  if (!Number.isFinite(cents) || cents <= 0 || cents >= 100) {
    return normalizeLimitPrice(fallback).toFixed(3);
  }

  return normalizeLimitPrice(cents / 100).toFixed(3);
}

/** Share price on 0–1 scale, displayed as cents-denominated USD (e.g. $12.35). */
export function formatTradePanelPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(normalizeLimitPrice(price) * 100);
}

export function formatOrderbookPrice(price: number): string {
  return formatTradePanelPrice(price);
}

export function formatOrderbookTotal(size: number, price: number): string {
  const total = normalizeLimitPrice(price) * size;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(total);
}

export function formatShareSize(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 4,
  }).format(value);
}

export function formatPayoutOdds(potentialPayout: number, estimatedTotalCost: number): string {
  if (!Number.isFinite(potentialPayout) || !Number.isFinite(estimatedTotalCost) || estimatedTotalCost <= 0) {
    return "n/a";
  }

  return `${(potentialPayout / estimatedTotalCost).toFixed(2)}x`;
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

export function validateOrderAmount(input: {
  amount: number;
  orderType: TradingOrderType;
  tradeSide: BidTradeSide;
  minOrderSize?: number;
}): string | undefined {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return "Enter a positive amount.";
  }

  if (input.orderType === "GTC" && input.tradeSide === "buy") {
    if (input.amount < LIMIT_BUY_MIN_SHARES) {
      return `Limit buy orders must be at least ${LIMIT_BUY_MIN_SHARES} shares.`;
    }

    return undefined;
  }

  if (input.orderType !== "GTC" && input.tradeSide === "buy") {
    if (input.minOrderSize !== undefined && input.amount < input.minOrderSize) {
      return `Amount must be at least $${input.minOrderSize}.`;
    }
  }

  return undefined;
}
