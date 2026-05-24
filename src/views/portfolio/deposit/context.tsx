"use client";

import { FundingAsset, type FundingToken } from "@/config/funding";
import {
  selectFundingTokenBalance,
  selectFundingTokenBalanceString,
} from "@/lib/funding/balance-selectors";
import {
  hasTokenPrice,
  selectTokenUsdValue,
  selectTotalFundingWalletUsd,
} from "@/lib/funding/price-selectors";
import { useBalancesStore } from "@/store/use-balances";
import { usePricesStore } from "@/store/use-prices";
import { createContext, useCallback, useContext, useMemo } from "react";

export interface DepositContextType {
  supportedAssets: FundingAsset[];
  balancesLoading: boolean;
  pricesLoading: boolean;
  getTokenBalance: (token: Pick<FundingToken, "chainId" | "address">) => string;
  getTokenBalanceString: (token: Pick<FundingToken, "chainId" | "address" | "decimals">) => string;
  getTokenUsdValue: (token: Pick<FundingToken, "symbol" | "chainId" | "address">) => number;
  hasTokenUsdPrice: (symbol: string) => boolean;
  connectedWalletBalanceUsd: number;
}

const DepositContext = createContext<DepositContextType>({
  supportedAssets: [],
  balancesLoading: false,
  pricesLoading: false,
  getTokenBalance: () => "0",
  getTokenBalanceString: () => "0",
  getTokenUsdValue: () => 0,
  hasTokenUsdPrice: () => false,
  connectedWalletBalanceUsd: 0,
});

export function DepositProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: Pick<DepositContextType, "supportedAssets" | "balancesLoading" | "pricesLoading">;
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

  const contextValue = useMemo(
    () => ({
      supportedAssets: value.supportedAssets,
      balancesLoading: value.balancesLoading,
      pricesLoading: value.pricesLoading,
      getTokenBalance,
      getTokenBalanceString,
      getTokenUsdValue,
      hasTokenUsdPrice,
      connectedWalletBalanceUsd,
    }),
    [
      connectedWalletBalanceUsd,
      getTokenBalance,
      getTokenBalanceString,
      getTokenUsdValue,
      hasTokenUsdPrice,
      value.balancesLoading,
      value.pricesLoading,
      value.supportedAssets,
    ],
  );

  return <DepositContext.Provider value={contextValue}>{children}</DepositContext.Provider>;
}

export function useDepositContext() {
  return useContext(DepositContext);
}
