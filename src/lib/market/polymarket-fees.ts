import type { PolymarketFeeDetails } from "@/types/market";

const MIN_PRICE = 0.01;
const MAX_PRICE = 0.99;

export function estimateBuyTakerFee({
  orderCost,
  price,
  fee,
  builderTakerFeeRate = 0,
}: {
  orderCost: number;
  price: number;
  fee?: Pick<PolymarketFeeDetails, "rate" | "exponent">;
  builderTakerFeeRate?: number;
}): number {
  if (!Number.isFinite(orderCost) || orderCost <= 0) {
    return 0;
  }

  return roundMoney(orderCost * getBuyTakerFeeMultiplier({ price, fee, builderTakerFeeRate }));
}

export function calculateBuyOrderCostFromBudget({
  budget,
  price,
  fee,
  builderTakerFeeRate = 0.03
}: {
  budget: number;
  price: number;
  fee?: Pick<PolymarketFeeDetails, "rate" | "exponent">;
  builderTakerFeeRate?: number;
}): number {
  if (!Number.isFinite(budget) || budget <= 0) {
    return 0;
  }

  const feeMultiplier = getBuyTakerFeeMultiplier({
    price,
    fee,
    builderTakerFeeRate
  });

  if (feeMultiplier <= 0) {
    return roundMoney(budget);
  }

  return roundMoneyDown(budget / (1 + feeMultiplier));
}

export function getBuyTakerFeeMultiplier({
  price,
  fee,
  builderTakerFeeRate = 0,
}: {
  price: number;
  fee?: Pick<PolymarketFeeDetails, "rate" | "exponent">;
  builderTakerFeeRate?: number;
}): number {
  const platformFeeMultiplier = getPlatformBuyTakerFeeMultiplier(price, fee);
  const builderFeeMultiplier = Number.isFinite(builderTakerFeeRate) && builderTakerFeeRate > 0 ? builderTakerFeeRate : 0;

  return platformFeeMultiplier + builderFeeMultiplier;
}

function getPlatformBuyTakerFeeMultiplier(
  price: number,
  fee: Pick<PolymarketFeeDetails, "rate" | "exponent"> | undefined,
): number {
  if (
    !Number.isFinite(price) ||
    price <= 0 ||
    !fee ||
    !Number.isFinite(fee.rate) ||
    fee.rate <= 0 ||
    !Number.isFinite(fee.exponent) ||
    fee.exponent < 0
  ) {
    return 0;
  }

  const normalizedPrice = clamp(price, MIN_PRICE, MAX_PRICE);
  const effectiveFeeRate = fee.rate * (normalizedPrice * (1 - normalizedPrice)) ** fee.exponent;

  return effectiveFeeRate / normalizedPrice;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundMoneyDown(value: number): number {
  return Math.floor((value + Number.EPSILON) * 100) / 100;
}
