import type { BidTradeSide, OrderOutcomeSide, PolymarketFeeDetails, TradingOrderType } from "@/types/market";
import {
  calculateBuyOrderCostFromBudget,
  estimateBuyTakerFee,
} from "@/lib/market/polymarket-fees";

const MIN_PRICE = 0.01;
const MAX_PRICE = 0.99;

export type MarketTickSize = "0.1" | "0.01" | "0.001" | "0.0001";

export const DEFAULT_MARKET_TICK_SIZE: MarketTickSize = "0.01";

const TICK_PRICE_DECIMALS: Record<MarketTickSize, number> = {
  "0.1": 1,
  "0.01": 2,
  "0.001": 3,
  "0.0001": 4,
};

export const LIMIT_BUY_MIN_SHARES = 5;

export function isMarketTickSize(value: unknown): value is MarketTickSize {
  return (
    value === "0.1" ||
    value === "0.01" ||
    value === "0.001" ||
    value === "0.0001"
  );
}

export function resolveTickPriceDecimalPlaces(
  tickSize: MarketTickSize | string | undefined = DEFAULT_MARKET_TICK_SIZE,
): number {
  if (isMarketTickSize(tickSize)) {
    return TICK_PRICE_DECIMALS[tickSize];
  }

  return TICK_PRICE_DECIMALS[DEFAULT_MARKET_TICK_SIZE];
}

/** Aligns CLOB prices to the market tick precision (matches Polymarket ROUNDING_CONFIG). */
export function roundPriceToTick(
  price: number,
  tickSize: MarketTickSize | string | undefined = DEFAULT_MARKET_TICK_SIZE,
): number {
  if (!Number.isFinite(price)) {
    return price;
  }

  const clamped = clamp(price, MIN_PRICE, MAX_PRICE);
  const decimals = resolveTickPriceDecimalPlaces(tickSize);
  const factor = 10 ** decimals;

  return Math.round((clamped + Number.EPSILON) * factor) / factor;
}

export function isLimitOrderType(orderType: TradingOrderType): boolean {
  return orderType === "GTC" || orderType === "GTD";
}

/** Slippage buffer for FAK/FOK worst-price limits (Polymarket market order behavior). */
export const MARKET_ORDER_SLIPPAGE_BPS = 200;

export interface ResolveMarketOrderWorstPriceInput {
  tradeSide: BidTradeSide;
  sidePrice: number;
  bestAsk?: number;
  bestBid?: number;
  tickSize?: MarketTickSize | string;
}

/**
 * Worst acceptable price for FAK/FOK orders. CLOB treats this as slippage protection,
 * not the target fill price. Uses the higher of ticket and book prices for buys, then
 * applies a small upward buffer so stale REST quotes cannot under-sign market orders.
 */
export function resolveMarketOrderWorstPrice(
  input: ResolveMarketOrderWorstPriceInput,
): number {
  const tickSize = input.tickSize ?? DEFAULT_MARKET_TICK_SIZE;
  const slippageFactor =
    input.tradeSide === "buy"
      ? 1 + MARKET_ORDER_SLIPPAGE_BPS / 10_000
      : 1 - MARKET_ORDER_SLIPPAGE_BPS / 10_000;
  const executableBase =
    input.tradeSide === "buy"
      ? Math.max(input.sidePrice, input.bestAsk ?? input.sidePrice)
      : Math.min(input.sidePrice, input.bestBid ?? input.sidePrice);

  return roundPriceToTick(executableBase * slippageFactor, tickSize);
}

export function isMarketOrderType(orderType: TradingOrderType): boolean {
  return orderType === "FAK" || orderType === "FOK";
}

function resolveMarketOrderPriceGuardTolerance(
  tickSize: MarketTickSize | string | undefined = DEFAULT_MARKET_TICK_SIZE,
): number {
  const resolvedTickSize = isMarketTickSize(tickSize)
    ? tickSize
    : DEFAULT_MARKET_TICK_SIZE;

  return Number(resolvedTickSize);
}

export function isSignedMarketOrderPriceWithinGuard(input: {
  orderPrice: number;
  tradeSide: BidTradeSide;
  sidePrice: number;
  bestAsk?: number;
  bestBid?: number;
  tickSize?: MarketTickSize | string;
}): boolean {
  const tolerance = resolveMarketOrderPriceGuardTolerance(input.tickSize);
  const guardedPrice = resolveMarketOrderWorstPrice({
    tradeSide: input.tradeSide,
    sidePrice: input.sidePrice,
    bestAsk: input.bestAsk,
    bestBid: input.bestBid,
    tickSize: input.tickSize,
  });

  if (input.tradeSide === "buy") {
    return input.orderPrice <= guardedPrice + tolerance;
  }

  return input.orderPrice >= guardedPrice - tolerance;
}

export function isTakeProfitLimitAvailable(shareSize: number): boolean {
  return Number.isFinite(shareSize) && shareSize >= LIMIT_BUY_MIN_SHARES;
}

export function formatTakeProfitLimitDisabledMessage(): string {
  return `Take profit limit requires a market buy of at least ${LIMIT_BUY_MIN_SHARES} shares.`;
}

export function validateTakeProfitLimitPrice(
  enabled: boolean,
  price: string
): string | undefined {
  if (!enabled || price.trim()) {
    return undefined;
  }

  return "Enter a take profit limit price.";
}

export interface OrderEstimateInput {
  side: OrderOutcomeSide;
  tradeSide?: BidTradeSide;
  amount: number;
  probability: number;
  limitPrice?: number;
  orderType: TradingOrderType;
  fee?: PolymarketFeeDetails;
  /** Caps sell share size to on-chain balance or position size. */
  maxShareSize?: number;
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

export const TAKE_PROFIT_LIMIT_DEFAULT_MULTIPLIER = 1.2;

export function deriveDefaultTakeProfitLimitPrice(
  purchasePrice: number
): number {
  if (!Number.isFinite(purchasePrice) || purchasePrice <= 0) {
    return MIN_PRICE;
  }

  return normalizeLimitPrice(
    purchasePrice * TAKE_PROFIT_LIMIT_DEFAULT_MULTIPLIER
  );
}

export function formatTakeProfitLimitPriceString(purchasePrice: number): string {
  return deriveDefaultTakeProfitLimitPrice(purchasePrice).toFixed(3);
}

export function calculateOrderEstimate(input: OrderEstimateInput): OrderEstimate {
  const sidePrice = normalizeLimitPrice(input.limitPrice ?? calculateReferencePrice(input.probability, input.side));
  const tradeSide = input.tradeSide ?? "buy";
  const isLimitOrder = isLimitOrderType(input.orderType);

  if (isLimitOrder) {
    let shareSize = roundShares(Math.max(0, input.amount));
    shareSize = capSellShareSize(shareSize, tradeSide, input.maxShareSize);
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

  const requestedAmount =
    tradeSide === "sell"
      ? floorShares(Math.max(0, input.amount))
      : roundBudgetDown(Math.max(0, input.amount));
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
  let shareSize =
    tradeSide === "buy" && sidePrice > 0
      ? roundShares(orderCost / sidePrice)
      : roundShares(orderCost);
  shareSize = capSellShareSize(shareSize, tradeSide, input.maxShareSize);
  const resolvedOrderCost = tradeSide === "sell" ? shareSize : orderCost;
  const resolvedTotalCost =
    tradeSide === "buy" ? estimatedTotalCost : resolvedOrderCost;
  const potentialPayout = tradeSide === "buy" ? roundMoney(shareSize) : roundMoney(shareSize * sidePrice);

  return {
    sidePrice,
    shareSize,
    orderCost: resolvedOrderCost,
    estimatedCost: resolvedOrderCost,
    estimatedTakerFee,
    estimatedTotalCost: resolvedTotalCost,
    potentialPayout,
    potentialOutcome: roundMoney(potentialPayout - estimatedTotalCost),
  };
}

export function formatPriceCents(price: number): string {
  return `${(normalizeLimitPrice(price) * 100).toFixed(1)}c`;
}

/** Limit price stored on 0–1 scale, displayed as cents (e.g. 0.50 → "50"). */
export function formatLimitPriceInputValue(price: string | number): string {
  if (typeof price === "string" && price.trim() === "") {
    return "";
  }

  const numeric = typeof price === "string" ? Number(price) : price;

  if (!Number.isFinite(numeric)) {
    return "";
  }

  const cents = normalizeLimitPrice(numeric) * 100;

  return Number.isInteger(cents) ? String(cents) : cents.toFixed(1);
}

/** Cents-denominated limit price display: up to 2 integer digits and 1 decimal place. */
export function sanitizeLimitPriceDisplayInput(value: string): string {
  let result = "";
  let hasDot = false;

  for (const char of value) {
    if (char >= "0" && char <= "9") {
      if (hasDot) {
        const fractionLength = result.length - result.indexOf(".") - 1;

        if (fractionLength >= 1) {
          continue;
        }
      } else if (result.length >= 2) {
        continue;
      }

      result += char;
    } else if (char === "." && !hasDot && result.length > 0) {
      hasDot = true;
      result += char;
    }
  }

  return result;
}

export function isCompleteLimitPriceDisplayValue(value: string): boolean {
  const trimmed = value.trim();

  if (!trimmed || trimmed.endsWith(".")) {
    return false;
  }

  const cents = Number(trimmed);

  return Number.isFinite(cents) && cents > 0 && cents < 100;
}

/** Parse cents-denominated limit price input back to 0–1 scale string. */
export function parseLimitPriceDisplayValue(
  displayValue: string,
  fallback: number
): string {
  const trimmed = displayValue.trim();

  if (!trimmed) {
    return "";
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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(normalizeLimitPrice(price) * 100);
}

export function formatOrderbookPrice(price: number): string {
  return formatTradePanelPrice(price) + "￠";
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

export function floorShares(value: number): number {
  return Math.floor(value * 10000) / 10000;
}

/** Rounds USDC budget inputs down so values like 5.005 are not rounded up to 5.01. */
export function roundBudgetDown(value: number): number {
  return Math.floor((value + Number.EPSILON) * 10000) / 10000;
}

export function resolveMaxSellShares(
  ...candidates: Array<number | undefined>
): number | undefined {
  const valid = candidates.filter(
    (value): value is number =>
      value !== undefined && Number.isFinite(value) && value > 0
  );

  if (valid.length === 0) {
    return undefined;
  }

  return floorShares(Math.min(...valid));
}

function roundShares(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function capSellShareSize(
  shareSize: number,
  tradeSide: BidTradeSide,
  maxShareSize?: number
): number {
  if (tradeSide !== "sell" || maxShareSize === undefined) {
    return shareSize;
  }

  return floorShares(Math.min(shareSize, maxShareSize));
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

  if (isLimitOrderType(input.orderType) && input.tradeSide === "buy") {
    if (input.amount < LIMIT_BUY_MIN_SHARES) {
      return `Limit buy orders must be at least ${LIMIT_BUY_MIN_SHARES} shares.`;
    }

    return undefined;
  }

  if (!isLimitOrderType(input.orderType) && input.tradeSide === "buy") {
    if (input.minOrderSize !== undefined && input.amount < input.minOrderSize) {
      return `Amount must be at least $${input.minOrderSize}.`;
    }
  }

  return undefined;
}
