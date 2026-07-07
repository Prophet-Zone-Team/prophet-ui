"use client";

import { FUNDING_NETWORKS } from "@/config/funding/networks";
import { type FundingToken } from "@/config/funding";
import {
  selectFundingTokenBalance,
  selectFundingTokenBalanceString,
} from "@/lib/funding/balance-selectors";
import {
  hasTokenPrice,
} from "@/lib/funding/price-selectors";
import type { StableflowDepositToken } from "@/lib/funding/stableflow";
import type { FundingWalletChainType } from "@/store/use-funding-wallet-store";
import { useBalancesStore } from "@/store/use-balances";
import { usePricesStore } from "@/store/use-prices";
import { createContext, useCallback, useContext, useMemo } from "react";

import type { PrivateTopupSelectableToken } from "./types";
import { getTokenUsdValueForTopup } from "./utils";

export interface PrivateTopupContextType {
  selectableTokens: PrivateTopupSelectableToken[];
  topupWalletAddress?: string;
  privateAccountAddress?: string;
  primaryChainType?: FundingWalletChainType;
  balancesLoading: boolean;
  pricesLoading: boolean;
  getTokenBalance: (
    token: Pick<FundingToken, "chainId" | "address" | "symbol" | "decimals"> & {
      blockchain?: string;
    },
  ) => string;
  getTokenBalanceString: (
    token: Pick<FundingToken, "chainId" | "address" | "decimals" | "symbol"> & {
      blockchain?: string;
    },
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
    | "primaryChainType"
    | "balancesLoading"
    | "pricesLoading"
  > & {
    getNearTokenBalance?: (
      token: Pick<StableflowDepositToken, "chainId" | "address" | "blockchain">,
    ) => string;
    getSolTokenBalance?: (
      token: Pick<FundingToken, "chainId" | "address" | "symbol" | "decimals">,
    ) => string;
    getTronTokenBalance?: (
      token: Pick<FundingToken, "chainId" | "address" | "symbol" | "decimals">,
    ) => string;
  };
}) {
  const evmBalances = useBalancesStore((state) => state.evmBalances);
  const prices = usePricesStore((state) => state.prices);

  const getTokenBalance = useCallback(
    (
      token: Pick<FundingToken, "chainId" | "address" | "symbol" | "decimals"> & {
        blockchain?: string;
      },
    ) => {
      if (token.blockchain === "near" && value.getNearTokenBalance) {
        return value.getNearTokenBalance(token as StableflowDepositToken);
      }

      if (token.chainId === FUNDING_NETWORKS.solana.chainId && value.getSolTokenBalance) {
        return value.getSolTokenBalance(token);
      }

      if (token.chainId === FUNDING_NETWORKS.tron.chainId && value.getTronTokenBalance) {
        return value.getTronTokenBalance(token);
      }

      return selectFundingTokenBalance(evmBalances, token);
    },
    [evmBalances, value.getNearTokenBalance, value.getSolTokenBalance, value.getTronTokenBalance],
  );

  const getTokenBalanceString = useCallback(
    (
      token: Pick<FundingToken, "chainId" | "address" | "decimals" | "symbol"> & {
        blockchain?: string;
      },
    ) => {
      if (token.blockchain === "near" && value.getNearTokenBalance) {
        return value.getNearTokenBalance(token as StableflowDepositToken);
      }

      if (token.chainId === FUNDING_NETWORKS.solana.chainId && value.getSolTokenBalance) {
        return value.getSolTokenBalance(token);
      }

      if (token.chainId === FUNDING_NETWORKS.tron.chainId && value.getTronTokenBalance) {
        return value.getTronTokenBalance(token);
      }

      return selectFundingTokenBalanceString(evmBalances, token);
    },
    [evmBalances, value.getNearTokenBalance, value.getSolTokenBalance, value.getTronTokenBalance],
  );

  const getTokenUsdValue = useCallback(
    (token: StableflowDepositToken) => {
      const balance = getTokenBalance(token);
      return getTokenUsdValueForTopup(prices, token, balance);
    },
    [getTokenBalance, prices],
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
      primaryChainType: value.primaryChainType,
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
      value.getNearTokenBalance,
      value.getSolTokenBalance,
      value.getTronTokenBalance,
      value.pricesLoading,
      value.primaryChainType,
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
