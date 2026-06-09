"use client";

import { type FundingToken } from "@/config/funding";
import {
  selectFundingTokenBalance,
  selectFundingTokenBalanceString,
} from "@/lib/funding/balance-selectors";
import {
  hasTokenPrice,
  selectTokenUsdValue,
  selectTotalFundingWalletUsd,
} from "@/lib/funding/price-selectors";
import type { StableflowDepositToken } from "@/lib/funding/stableflow";
import { useBalancesStore } from "@/store/use-balances";
import { usePricesStore } from "@/store/use-prices";
import { createContext, useCallback, useContext, useMemo } from "react";

import type { DepositMethod, DepositSelectableToken } from "./types";
import { isStableflowDepositToken } from "./types";

export interface DepositContextType {
  depositMethod: DepositMethod;
  selectableTokens: DepositSelectableToken[];
  funderAddress?: string;
  supportedAssets: DepositSelectableToken[];
  balancesLoading: boolean;
  pricesLoading: boolean;
  getTokenBalance: (token: Pick<FundingToken, "chainId" | "address">) => string;
  getTokenBalanceString: (token: Pick<FundingToken, "chainId" | "address" | "decimals">) => string;
  getTokenUsdValue: (token: Pick<FundingToken, "symbol" | "chainId" | "address">) => number;
  hasTokenUsdPrice: (symbol: string) => boolean;
  connectedWalletBalanceUsd: number;
  stableflowBalanceUsd: number;
}

const DepositContext = createContext<DepositContextType>({
  depositMethod: "connected",
  selectableTokens: [],
  supportedAssets: [],
  balancesLoading: false,
  pricesLoading: false,
  getTokenBalance: () => "0",
  getTokenBalanceString: () => "0",
  getTokenUsdValue: () => 0,
  hasTokenUsdPrice: () => false,
  connectedWalletBalanceUsd: 0,
  stableflowBalanceUsd: 0,
});

export function DepositProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: Pick<
    DepositContextType,
    | "depositMethod"
    | "selectableTokens"
    | "funderAddress"
    | "supportedAssets"
    | "balancesLoading"
    | "pricesLoading"
  >;
}) {
  const evmBalances = useBalancesStore((state) => state.evmBalances);
  const prices = usePricesStore((state) => state.prices);

  const getTokenBalance = useCallback(
    (token: Pick<FundingToken, "chainId" | "address">) =>
      selectFundingTokenBalance(evmBalances, token),
    [evmBalances],
  );

  const getTokenBalanceString = useCallback(
    (token: Pick<FundingToken, "chainId" | "address" | "decimals">) =>
      selectFundingTokenBalanceString(evmBalances, token),
    [evmBalances],
  );

  const getTokenUsdValue = useCallback(
    (token: Pick<FundingToken, "symbol" | "chainId" | "address">) => {
      const balance = selectFundingTokenBalance(evmBalances, token);

      if (isStableflowDepositToken(token as DepositSelectableToken)) {
        const stableflowToken = token as StableflowDepositToken;
        const price = stableflowToken.price;

        if (price > 0) {
          return Number(balance) * price;
        }
      }

      return selectTokenUsdValue(prices, token.symbol, balance);
    },
    [evmBalances, prices],
  );

  const hasTokenUsdPrice = useCallback(
    (symbol: string) => hasTokenPrice(prices, symbol),
    [prices],
  );

  const connectedWalletBalanceUsd = useMemo(
    () => selectTotalFundingWalletUsd(evmBalances, prices),
    [evmBalances, prices],
  );

  const stableflowBalanceUsd = useMemo(() => {
    if (value.depositMethod !== "stableflow") {
      return 0;
    }

    return value.selectableTokens.reduce((total, token) => total + getTokenUsdValue(token), 0);
  }, [getTokenUsdValue, value.depositMethod, value.selectableTokens]);

  const contextValue = useMemo(
    () => ({
      depositMethod: value.depositMethod,
      selectableTokens: value.selectableTokens,
      funderAddress: value.funderAddress,
      supportedAssets: value.supportedAssets,
      balancesLoading: value.balancesLoading,
      pricesLoading: value.pricesLoading,
      getTokenBalance,
      getTokenBalanceString,
      getTokenUsdValue,
      hasTokenUsdPrice,
      connectedWalletBalanceUsd,
      stableflowBalanceUsd,
    }),
    [
      connectedWalletBalanceUsd,
      getTokenBalance,
      getTokenBalanceString,
      getTokenUsdValue,
      hasTokenUsdPrice,
      stableflowBalanceUsd,
      value.balancesLoading,
      value.depositMethod,
      value.funderAddress,
      value.pricesLoading,
      value.selectableTokens,
      value.supportedAssets,
    ],
  );

  return <DepositContext.Provider value={contextValue}>{children}</DepositContext.Provider>;
}

export function useDepositContext() {
  return useContext(DepositContext);
}
