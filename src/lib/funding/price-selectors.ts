import Big from "big.js";

import { FUNDING_TOKENS_LIST, FundingNetworkType, STABLECOIN_SYMBOLS } from "@/config/funding";
import {
  isStablecoinSymbol,
  selectFundingTokenBalance,
} from "@/lib/funding/balance-selectors";
import type { EvmBalancesByChain, TokenPricesBySymbol } from "@/types/funding";

const EVM_FUNDING_TOKENS = FUNDING_TOKENS_LIST.filter(
  (token) => token.chainType === FundingNetworkType.EVM,
);

export function selectTokenPrice(
  prices: TokenPricesBySymbol,
  symbol: string,
): string | undefined {
  const price = prices[symbol];

  if (price === undefined || price === "") {
    if (STABLECOIN_SYMBOLS.has(symbol)) {
      return "1";
    }
    return undefined;
  }

  return price;
}

export function hasTokenPrice(prices: TokenPricesBySymbol, symbol: string): boolean {
  return selectTokenPrice(prices, symbol) !== undefined;
}

export function selectTokenPriceNumber(prices: TokenPricesBySymbol, symbol: string): number {
  const price = selectTokenPrice(prices, symbol);

  if (price === undefined) {
    if (isStablecoinSymbol(symbol)) {
      return 1;
    }

    return 0;
  }

  try {
    const parsed = Big(price);

    if (parsed.lte(0)) {
      return isStablecoinSymbol(symbol) ? 1 : 0;
    }

    return parsed.toNumber();
  } catch {
    return isStablecoinSymbol(symbol) ? 1 : 0;
  }
}

export function selectTokenUsdValue(
  prices: TokenPricesBySymbol,
  symbol: string,
  balanceDecimal: string | number,
): number {
  try {
    const balance = Big(balanceDecimal);

    if (balance.lte(0)) {
      return 0;
    }

    const price = selectTokenPriceNumber(prices, symbol);
    return balance.times(price).toNumber();
  } catch {
    return 0;
  }
}

export function selectTotalFundingWalletUsd(
  evmBalances: EvmBalancesByChain,
  prices: TokenPricesBySymbol,
): number {
  let total = Big(0);

  for (const token of EVM_FUNDING_TOKENS) {
    const balance = selectFundingTokenBalance(evmBalances, token);

    try {
      if (Big(balance).lte(0)) {
        continue;
      }
    } catch {
      continue;
    }

    total = total.plus(selectTokenUsdValue(prices, token.symbol, balance));
  }

  return total.toNumber();
}
