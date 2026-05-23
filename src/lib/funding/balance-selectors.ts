import Big from "big.js";

import { FUNDING_TOKENS_LIST, STABLECOIN_SYMBOLS, type FundingToken } from "@/config/funding";
import { normalizeTokenAddress } from "@/lib/funding/evm-balances";
import type { EvmBalancesByChain } from "@/types/funding";

export function selectTokenBalance(
  balances: EvmBalancesByChain,
  chainId: number,
  address: string,
): string {
  const chainKey = String(chainId);
  const tokenKey = normalizeTokenAddress(address);
  return balances[chainKey]?.[tokenKey] ?? "0";
}

export function selectFundingTokenBalance(
  balances: EvmBalancesByChain,
  token: Pick<FundingToken, "chainId" | "address">,
): string {
  return selectTokenBalance(balances, token.chainId, token.address);
}

export function selectFundingTokenBalanceNumber(
  balances: EvmBalancesByChain,
  token: Pick<FundingToken, "chainId" | "address">,
): number {
  const value = selectFundingTokenBalance(balances, token);

  try {
    return Big(value).toNumber();
  } catch {
    return 0;
  }
}

export function selectTotalStablecoinBalanceUsd(balances: EvmBalancesByChain): number {
  let total = Big(0);

  for (const token of FUNDING_TOKENS_LIST) {
    if (!STABLECOIN_SYMBOLS.has(token.symbol)) {
      continue;
    }

    const balance = selectFundingTokenBalance(balances, token);

    try {
      total = total.plus(Big(balance));
    } catch {
      continue;
    }
  }

  return total.toNumber();
}

export function isStablecoinSymbol(symbol: string): boolean {
  return STABLECOIN_SYMBOLS.has(symbol);
}
