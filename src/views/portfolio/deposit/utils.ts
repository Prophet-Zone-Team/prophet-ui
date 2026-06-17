import Big from "big.js";

import {
  STABLEFLOW_QR_MIN_DEPOSIT_USD,
  type StableflowDepositToken,
} from "@/lib/funding/stableflow";
import { selectTokenPrice } from "@/lib/funding/price-selectors";
import type { TokenPricesBySymbol } from "@/types/funding";
import { removeNumberEndZero } from "@/utils";

import { DEFAULT_DEPOSIT_TOKEN_ORDER } from "./config";
import type { DepositSelectableToken } from "./types";
import { isStableflowDepositToken } from "./types";
import { STABLECOIN_SYMBOLS } from "@/config/funding";

const DEFAULT_DEPOSIT_TOKEN_SORT_INDEX = new Map(
  DEFAULT_DEPOSIT_TOKEN_ORDER.map((entry, index) => [
    `${entry.chainId}:${entry.symbol}`,
    index,
  ]),
);

export function getDefaultDepositTokenSortIndex(
  token: Pick<DepositSelectableToken, "chainId" | "symbol">,
): number {
  return (
    DEFAULT_DEPOSIT_TOKEN_SORT_INDEX.get(`${token.chainId}:${token.symbol}`) ??
    DEFAULT_DEPOSIT_TOKEN_ORDER.length
  );
}

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
  if (STABLECOIN_SYMBOLS.has(token.symbol)) {
    return "1";
  }

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

  // if (Big(tokenAmount).gt(maxAmount || 0)) {
  //   tokenAmount = removeNumberEndZero(
  //     Big(maxAmount || 0).toFixed(decimals, Big.roundDown),
  //   );
  // }

  const clampedToMax = Big(maxAmount || 0).gt(0)
    && Big(tokenAmount).eq(maxAmount || 0);

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

export type DepositAmountErrorKey =
  | "amountZero"
  | "amountBelowMinimum"
  | "amountExceedsBalance";

export function validateDepositAmount(
  tokenAmount: string | undefined,
  maxAmount: string,
  options?: ValidateDepositAmountOptions,
): DepositAmountErrorKey | undefined {
  if (maxAmount === undefined || Big(maxAmount).lte(0)) {
    return "amountExceedsBalance";
  }

  if (tokenAmount === undefined || Big(tokenAmount).lte(0)) {
    return "amountZero";
  }

  const minDepositUsd = options?.minDepositUsd ?? 0;

  if (
    minDepositUsd > 0 &&
    options?.amountUsd !== undefined &&
    Big(options.amountUsd).lt(minDepositUsd)
  ) {
    return "amountBelowMinimum";
  }

  if (Big(tokenAmount).gt(maxAmount || 0)) {
    return "amountExceedsBalance";
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

export function buildStableflowQrQuoteAmount(
  token: StableflowDepositToken,
  prices: TokenPricesBySymbol,
): { tokenAmount: string; amountUsd: string; amountBaseUnits: string } {
  const price = selectDepositTokenUnitPrice(prices, token);

  const unitPrice =
    price && Big(price).gt(0)
      ? price
      : token.price > 0
        ? String(token.price)
        : "1";

  const { tokenAmount, amountUsd } = usdInputToTokenAmount({
    usdInput: String(STABLEFLOW_QR_MIN_DEPOSIT_USD),
    maxAmount: "999999",
    price: unitPrice,
    decimals: token.decimals,
  });

  const amountBaseUnits = Big(tokenAmount)
    .times(10 ** token.decimals)
    .toFixed(0, 0);

  return { tokenAmount, amountUsd, amountBaseUnits };
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

export function matchesDepositTokenSearch(
  token: Pick<DepositSelectableToken, "symbol" | "chainName">,
  query: string,
): boolean {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  return (
    token.symbol.toLowerCase().includes(normalized) ||
    token.chainName.toLowerCase().includes(normalized)
  );
}
