import Big from "big.js";

import { STABLECOIN_SYMBOLS } from "@/config/funding";
import { FundingNetworkType } from "@/config/funding/networks";
import {
  hasTokenPrice,
  selectTokenPrice,
  selectTokenUsdValue,
} from "@/lib/funding/price-selectors";
import {
  resolveFundingWalletAddress,
  type StableflowDepositToken,
} from "@/lib/funding/stableflow";
import type { FundingWalletChainType } from "@/store/use-funding-wallet-store";
import { getFundingWalletAddress } from "@/store/use-funding-wallet-store";
import type { TokenPricesBySymbol } from "@/types/funding";
import { removeNumberEndZero } from "@/utils";

import type { PrivateTopupSelectableToken } from "./types";

export function resolvePrivateTopupTransferAddress(
  token: PrivateTopupSelectableToken,
  primaryChainType: FundingWalletChainType,
): string | undefined {
  if (token.blockchain === "near") {
    return getFundingWalletAddress("near");
  }

  if (
    token.chainType === FundingNetworkType.SVM ||
    token.chainType === FundingNetworkType.TVM ||
    token.chainType === FundingNetworkType.NEAR
  ) {
    return resolveFundingWalletAddress(token);
  }

  if (primaryChainType === "evm") {
    return getFundingWalletAddress("evm");
  }

  return getFundingWalletAddress("evm");
}

export function isPrivateTopupTransferWalletConnected(
  token: PrivateTopupSelectableToken,
  primaryChainType: FundingWalletChainType,
): boolean {
  return Boolean(resolvePrivateTopupTransferAddress(token, primaryChainType));
}

export type PrivateTopupConnectLabelKey =
  | "connectChainWallet"
  | "connectSolanaWallet"
  | "connectTronWallet"
  | "connectNearWallet";

export function getPrivateTopupConnectLabelKey(
  token: Pick<PrivateTopupSelectableToken, "chainType" | "chainName">,
): PrivateTopupConnectLabelKey {
  switch (token.chainType) {
    case FundingNetworkType.SVM:
      return "connectSolanaWallet";
    case FundingNetworkType.TVM:
      return "connectTronWallet";
    case FundingNetworkType.NEAR:
      return "connectNearWallet";
    default:
      return "connectChainWallet";
  }
}

export function formatPrivateTopupConnectLabel(
  tWallet: (key: PrivateTopupConnectLabelKey, values?: { chainName: string }) => string,
  token: Pick<PrivateTopupSelectableToken, "chainType" | "chainName">,
): string {
  const key = getPrivateTopupConnectLabelKey(token);

  if (key === "connectChainWallet") {
    return tWallet(key, { chainName: token.chainName });
  }

  return tWallet(key);
}

export function matchesPrivateTopupTokenSearch(
  token: Pick<PrivateTopupSelectableToken, "symbol" | "chainName">,
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

export function selectTokenUnitPrice(
  prices: TokenPricesBySymbol,
  token: Pick<StableflowDepositToken, "symbol" | "price">,
): string | undefined {
  if (STABLECOIN_SYMBOLS.has(token.symbol)) {
    return "1";
  }

  if (token.price > 0) {
    return String(token.price);
  }

  return selectTokenPrice(prices, token.symbol);
}

export function tokenAmountToUsd(
  amount: string,
  prices: TokenPricesBySymbol,
  token: Pick<StableflowDepositToken, "symbol" | "price">,
): string {
  const price = selectTokenUnitPrice(prices, token);

  if (!price || Big(price).lte(0)) {
    return "0";
  }

  return removeNumberEndZero(
    Big(amount || 0)
      .times(price)
      .toFixed(2, Big.roundDown),
  );
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
  token: StableflowDepositToken,
): string {
  const price = selectTokenUnitPrice(prices, token);

  if (!price) {
    return "0";
  }

  return tokenAmountToUsdFromPrice(tokenAmount, price);
}

export type PrivateTopupAmountErrorKey = "amountZero" | "amountExceedsBalance";

export function validatePrivateTopupAmount(
  tokenAmount: string | undefined,
  maxAmount: string,
): PrivateTopupAmountErrorKey | undefined {
  if (tokenAmount === undefined || Big(tokenAmount).lte(0)) {
    return "amountZero";
  }

  if (Big(tokenAmount).gt(maxAmount || 0)) {
    return "amountExceedsBalance";
  }

  return undefined;
}

export function isPrivateTopupAmountValid(
  tokenAmount: string,
  maxAmount: string,
): boolean {
  return validatePrivateTopupAmount(tokenAmount, maxAmount) === undefined;
}

export function hasResolvableTokenPrice(
  prices: TokenPricesBySymbol,
  token: Pick<StableflowDepositToken, "symbol" | "price">,
): boolean {
  if (token.price > 0) {
    return true;
  }

  return hasTokenPrice(prices, token.symbol);
}

export function getTokenUsdValueForTopup(
  prices: TokenPricesBySymbol,
  token: StableflowDepositToken,
  balance: string,
): number {
  if (token.price > 0) {
    return Number(balance) * token.price;
  }

  return selectTokenUsdValue(prices, token.symbol, balance);
}
