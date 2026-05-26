import Big from "big.js";

import { selectTokenPrice } from "@/lib/funding/price-selectors";
import type { TokenPricesBySymbol } from "@/types/funding";
import { removeNumberEndZero } from "@/utils";

import type { DepositSelectableToken } from "./types";
import { isStableflowDepositToken } from "./types";

export function getEffectiveMinDepositUsd(minCheckoutUsd: number): number {
  return Math.ceil(minCheckoutUsd);
}

export function parseUsdInput(raw: string): string | undefined {
  const normalized = raw.trim().replace(/[$,\s]/g, "");

  if (!normalized) {
    return undefined;
  }

  const value = Number(normalized);

  if (!Number.isFinite(value) || value < 0) {
    return undefined;
  }

  return normalized;
}

export function selectDepositTokenUnitPrice(
  prices: TokenPricesBySymbol,
  token: DepositSelectableToken,
): string | undefined {
  if (isStableflowDepositToken(token) && token.price > 0) {
    return String(token.price);
  }

  return selectTokenPrice(prices, token.symbol);
}

function tokenAmountToUsdFromPrice(amount: string, price: string): string {
  return removeNumberEndZero(
    Big(amount || 0)
      .times(price || 0)
      .toFixed(2, Big.roundDown),
  );
}

export function computeUsdFromTokenAmount(
  tokenAmount: string,
  prices: TokenPricesBySymbol,
  token: DepositSelectableToken,
): string {
  const price = selectDepositTokenUnitPrice(prices, token);

  if (!price || Big(price).lte(0)) {
    return "0";
  }

  return tokenAmountToUsdFromPrice(tokenAmount, price);
}

export function applyTokenBalancePercent(
  maxAmount: string,
  percent: number,
  decimals: number,
): string {
  const amount = Big(maxAmount || 0).times(percent).div(100);
  return removeNumberEndZero(amount.toFixed(decimals, Big.roundDown));
}

export function usdInputToTokenAmount({
  usdInput,
  maxAmount,
  price,
  decimals,
}: {
  usdInput: string;
  maxAmount: string;
  price: string;
  decimals: number;
}): { tokenAmount: string; amountUsd: string } {
  const usd = Big(usdInput || 0);
  const unitPrice = Big(price || 0);

  if (usd.lte(0) || unitPrice.lte(0)) {
    return { tokenAmount: "0", amountUsd: "0" };
  }

  let tokenAmount = usd.div(unitPrice).toFixed(decimals, Big.roundDown);

  if (Big(tokenAmount).gt(maxAmount || 0)) {
    tokenAmount = removeNumberEndZero(
      Big(maxAmount || 0).toFixed(decimals, Big.roundDown),
    );
  }

  const clampedToMax =
    Big(maxAmount || 0).gt(0) && Big(tokenAmount).eq(maxAmount || 0);

  return {
    tokenAmount,
    amountUsd: clampedToMax
      ? tokenAmountToUsdFromPrice(tokenAmount, unitPrice.toString())
      : removeNumberEndZero(usd.toFixed(2, Big.roundDown)),
  };
}

export interface ValidateDepositAmountOptions {
  minDepositUsd?: number;
  amountUsd?: string;
}

export function validateDepositAmount(
  tokenAmount: string | undefined,
  maxAmount: string,
  options?: ValidateDepositAmountOptions,
): string | undefined {
  if (tokenAmount === undefined || Big(tokenAmount).lte(0)) {
    return "Enter an amount greater than zero.";
  }

  const minDepositUsd = options?.minDepositUsd ?? 0;

  if (
    minDepositUsd > 0 &&
    options?.amountUsd !== undefined &&
    Big(options.amountUsd).lt(minDepositUsd)
  ) {
    return `Minimum deposit is $${minDepositUsd}.`;
  }

  if (Big(tokenAmount).gt(maxAmount || 0)) {
    return "Amount exceeds available balance.";
  }

  return undefined;
}

export function isDepositAmountValid(
  tokenAmount: string,
  maxAmount: string,
  options?: ValidateDepositAmountOptions,
): boolean {
  return (
    validateDepositAmount(tokenAmount, maxAmount, options) === undefined
  );
}

export function buildDepositAmountFromMinUsd(
  minCheckoutUsd: number,
  maxAmount: string,
  prices: TokenPricesBySymbol,
  token: DepositSelectableToken,
): { tokenAmount: string; amountUsd: string } {
  const effectiveMinUsd = getEffectiveMinDepositUsd(minCheckoutUsd);
  const price = selectDepositTokenUnitPrice(prices, token);

  if (!price || Big(price).lte(0)) {
    return { tokenAmount: "0", amountUsd: String(effectiveMinUsd) };
  }

  return usdInputToTokenAmount({
    usdInput: String(effectiveMinUsd),
    maxAmount,
    price,
    decimals: token.decimals,
  });
}

export function buildDepositAmountFromMaxBalance(
  maxAmount: string,
  prices: TokenPricesBySymbol,
  token: DepositSelectableToken,
): { tokenAmount: string; amountUsd: string } {
  const tokenAmount = applyTokenBalancePercent(
    maxAmount,
    100,
    token.decimals,
  );
  const amountUsd = computeUsdFromTokenAmount(tokenAmount, prices, token);

  return { tokenAmount, amountUsd };
}
