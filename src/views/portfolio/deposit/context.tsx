"use client";

import { FUNDING_NETWORKS } from "@/config/funding/networks";
import type { FundingToken } from "@/config/funding/tokens";
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
  getTokenBalance: (token: Pick<FundingToken, "chainId" | "address" | "symbol" | "decimals">) => string;
  getTokenBalanceString: (token: Pick<FundingToken, "chainId" | "address" | "decimals" | "symbol">) => string;
  getTokenUsdValue: (token: Pick<FundingToken, "symbol" | "chainId" | "address"> & { decimals?: number }) => number;
  hasTokenUsdPrice: (symbol: string) => boolean;
  connectedWalletBalanceUsd: number;
  stableflowBalanceUsd: number;
  hasPendingDeposit: boolean;
  converting: boolean;
  onConfirmPendingDeposit: () => void | Promise<void>;
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
  hasPendingDeposit: false,
  converting: false,
  onConfirmPendingDeposit: () => {},
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
    | "hasPendingDeposit"
    | "converting"
    | "onConfirmPendingDeposit"
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
    (token: Pick<FundingToken, "chainId" | "address" | "symbol" | "decimals"> & { assetId?: string; blockchain?: string; }) => {
      if (
        isStableflowDepositToken(token as DepositSelectableToken) &&
        (token as StableflowDepositToken).blockchain === "near" &&
        value.getNearTokenBalance
      ) {
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
    (token: Pick<FundingToken, "chainId" | "address" | "decimals" | "symbol"> & { assetId?: string; blockchain?: string; }) => {
      if (
        isStableflowDepositToken(token as DepositSelectableToken) &&
        (token as StableflowDepositToken).blockchain === "near" &&
        value.getNearTokenBalance
      ) {
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
    (token: Pick<FundingToken, "symbol" | "chainId" | "address"> & { decimals?: number; assetId?: string; blockchain?: string; }) => {
      const balance = getTokenBalance({
        symbol: token.symbol,
        chainId: token.chainId,
        address: token.address,
        decimals: token.decimals ?? 0,
        assetId: token.assetId,
        blockchain: token.blockchain,
      });

      if (isStableflowDepositToken(token as DepositSelectableToken)) {
        const stableflowToken = token as StableflowDepositToken;
        const price = stableflowToken.price;

        if (price > 0) {
          return Number(balance) * price;
        }
      }

      return selectTokenUsdValue(prices, token.symbol, balance);
    },
    [getTokenBalance, prices],
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
      hasPendingDeposit: value.hasPendingDeposit,
      converting: value.converting,
      onConfirmPendingDeposit: value.onConfirmPendingDeposit,
    }),
    [
      connectedWalletBalanceUsd,
      getTokenBalance,
      getTokenBalanceString,
      getTokenUsdValue,
      hasTokenUsdPrice,
      stableflowBalanceUsd,
      value.balancesLoading,
      value.converting,
      value.depositMethod,
      value.funderAddress,
      value.hasPendingDeposit,
      value.onConfirmPendingDeposit,
      value.getNearTokenBalance,
      value.getSolTokenBalance,
      value.getTronTokenBalance,
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
