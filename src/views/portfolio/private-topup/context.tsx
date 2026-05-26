"use client";

import { type FundingToken } from "@/config/funding";
import {
  selectFundingTokenBalance,
  selectFundingTokenBalanceString,
} from "@/lib/funding/balance-selectors";
import {
  hasTokenPrice,
  selectTokenUsdValue,
} from "@/lib/funding/price-selectors";
import type { StableflowDepositToken } from "@/lib/funding/stableflow";
import { useBalancesStore } from "@/store/use-balances";
import { usePricesStore } from "@/store/use-prices";
import { createContext, useCallback, useContext, useMemo } from "react";

import type { PrivateTopupSelectableToken } from "./types";
import { getTokenUsdValueForTopup } from "./utils";

export interface PrivateTopupContextType {
  selectableTokens: PrivateTopupSelectableToken[];
  topupWalletAddress?: string;
  privateAccountAddress?: string;
  balancesLoading: boolean;
  pricesLoading: boolean;
  getTokenBalance: (token: Pick<FundingToken, "chainId" | "address">) => string;
  getTokenBalanceString: (
    token: Pick<FundingToken, "chainId" | "address" | "decimals">,
  ) => string;
  getTokenUsdValue: (token: StableflowDepositToken) => number;
  hasTokenUsdPrice: (symbol: string) => boolean;
  topupWalletBalanceUsd: number;
}

const PrivateTopupContext = createContext<PrivateTopupContextType>({
  selectableTokens: [],
  balancesLoading: false,
  pricesLoading: false,
  getTokenBalance: () => "0",
  getTokenBalanceString: () => "0",
  getTokenUsdValue: () => 0,
  hasTokenUsdPrice: () => false,
  topupWalletBalanceUsd: 0,
});

export function PrivateTopupProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: Pick<
    PrivateTopupContextType,
    | "selectableTokens"
    | "topupWalletAddress"
    | "privateAccountAddress"
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
    (token: StableflowDepositToken) => {
      const balance = selectFundingTokenBalance(evmBalances, token);
      return getTokenUsdValueForTopup(prices, token, balance);
    },
    [evmBalances, prices],
  );

  const hasTokenUsdPrice = useCallback(
    (symbol: string) => hasTokenPrice(prices, symbol),
    [prices],
  );

  const topupWalletBalanceUsd = useMemo(
    () =>
      value.selectableTokens.reduce(
        (total, token) => total + getTokenUsdValue(token),
        0,
      ),
    [getTokenUsdValue, value.selectableTokens],
  );

  const contextValue = useMemo(
    () => ({
      selectableTokens: value.selectableTokens,
      topupWalletAddress: value.topupWalletAddress,
      privateAccountAddress: value.privateAccountAddress,
      balancesLoading: value.balancesLoading,
      pricesLoading: value.pricesLoading,
      getTokenBalance,
      getTokenBalanceString,
      getTokenUsdValue,
      hasTokenUsdPrice,
      topupWalletBalanceUsd,
    }),
    [
      getTokenBalance,
      getTokenBalanceString,
      getTokenUsdValue,
      hasTokenUsdPrice,
      topupWalletBalanceUsd,
      value.balancesLoading,
      value.pricesLoading,
      value.privateAccountAddress,
      value.selectableTokens,
      value.topupWalletAddress,
    ],
  );

  return (
    <PrivateTopupContext.Provider value={contextValue}>
      {children}
    </PrivateTopupContext.Provider>
  );
}

export function usePrivateTopupContext() {
  return useContext(PrivateTopupContext);
}
