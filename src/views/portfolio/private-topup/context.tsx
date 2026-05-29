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
  ownerWalletAddress?: string;
  privateAccountAddress?: string;
  privateBalanceUsd: number;
  balancesLoading: boolean;
  pricesLoading: boolean;
  refreshPrivateBalance?: () => Promise<void>;
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
  privateBalanceUsd: 0,
  balancesLoading: false,
  pricesLoading: false,
  getTokenBalance: () => "0",
  getTokenBalanceString: () => "0",
  getTokenUsdValue: () => 0,
  hasTokenUsdPrice: () => false,
  topupWalletBalanceUsd: 0,
  refreshPrivateBalance: undefined,
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
    | "ownerWalletAddress"
    | "privateAccountAddress"
    | "privateBalanceUsd"
    | "balancesLoading"
    | "pricesLoading"
    | "refreshPrivateBalance"
    | "topupWalletBalanceUsd"
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

  const contextValue = useMemo(
    () => ({
      selectableTokens: value.selectableTokens,
      topupWalletAddress: value.topupWalletAddress,
      ownerWalletAddress: value.ownerWalletAddress,
      privateAccountAddress: value.privateAccountAddress,
      privateBalanceUsd: value.privateBalanceUsd,
      balancesLoading: value.balancesLoading,
      pricesLoading: value.pricesLoading,
      refreshPrivateBalance: value.refreshPrivateBalance,
      getTokenBalance,
      getTokenBalanceString,
      getTokenUsdValue,
      hasTokenUsdPrice,
      topupWalletBalanceUsd: value.topupWalletBalanceUsd,
    }),
    [
      getTokenBalance,
      getTokenBalanceString,
      getTokenUsdValue,
      hasTokenUsdPrice,
      value.balancesLoading,
      value.topupWalletBalanceUsd,
      value.ownerWalletAddress,
      value.pricesLoading,
      value.privateAccountAddress,
      value.privateBalanceUsd,
      value.refreshPrivateBalance,
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
