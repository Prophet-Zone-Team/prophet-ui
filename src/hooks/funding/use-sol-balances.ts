"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Big from "big.js";

import { FUNDING_NETWORKS } from "@/config/funding/networks";
import type { FundingToken } from "@/config/funding/tokens";
import { getFundingWalletInstance } from "@/lib/wallet/solana/funding-wallet-instance";
import { isSolanaNativeToken } from "@/lib/wallet/solana/wallet";
import { useFundingWalletStore } from "@/store/use-funding-wallet-store";

const EMPTY_BALANCES: Record<string, string> = {};

function buildSolBalanceKey(token: Pick<FundingToken, "chainId" | "address">): string {
  return `${token.chainId}:${token.address.toLowerCase()}`;
}

function balancesAreEqual(
  left: Record<string, string>,
  right: Record<string, string>,
): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  return leftKeys.every((key) => left[key] === right[key]);
}

export interface UseSolBalancesOptions {
  enabled?: boolean;
  tokens?: FundingToken[];
}

export interface UseSolBalancesResult {
  loading: boolean;
  getTokenBalance: (token: Pick<FundingToken, "chainId" | "address" | "symbol" | "decimals">) => string;
  refresh: () => Promise<void>;
}

export function useSolBalances(options: UseSolBalancesOptions = {}): UseSolBalancesResult {
  const { enabled = true, tokens = [] } = options;
  const [balances, setBalances] = useState<Record<string, string>>(EMPTY_BALANCES);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);
  const address = useFundingWalletStore((state) =>
    state.solana.connected ? state.solana.address : undefined,
  );

  const solTokenKey = useMemo(
    () =>
      tokens
        .filter((token) => token.chainId === FUNDING_NETWORKS.solana.chainId)
        .map((token) => `${token.chainId}:${token.address.toLowerCase()}`)
        .join("|"),
    [tokens],
  );

  const clearBalances = useCallback(() => {
    setBalances((current) =>
      Object.keys(current).length === 0 ? current : EMPTY_BALANCES,
    );
  }, []);

  const refresh = useCallback(async () => {
    if (!enabled || !solTokenKey || !address) {
      clearBalances();
      setLoading(false);
      return;
    }

    const wallet = getFundingWalletInstance();

    if (!wallet) {
      clearBalances();
      setLoading(false);
      return;
    }

    const solTokens = tokens.filter(
      (token) => token.chainId === FUNDING_NETWORKS.solana.chainId,
    );

    const requestId = ++requestIdRef.current;
    setLoading(true);

    try {
      const nextBalances: Record<string, string> = {};

      await Promise.all(
        solTokens.map(async (token) => {
          const rawBalance = await wallet.balanceOf({
            address,
            symbol: token.symbol,
            tokenAddress: token.address,
          });
          const decimalBalance = isSolanaNativeToken(token.address, token.symbol)
            ? Big(rawBalance).div(10 ** token.decimals).toFixed(token.decimals)
            : Big(rawBalance).div(10 ** token.decimals).toFixed(token.decimals);
          nextBalances[buildSolBalanceKey(token)] = decimalBalance;
        }),
      );

      if (requestId === requestIdRef.current) {
        setBalances((current) =>
          balancesAreEqual(current, nextBalances) ? current : nextBalances,
        );
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [address, clearBalances, enabled, solTokenKey, tokens]);

  useEffect(() => {
    void refresh();
  }, [address, enabled, refresh, solTokenKey]);

  const getTokenBalance = useCallback(
    (token: Pick<FundingToken, "chainId" | "address" | "symbol" | "decimals">) => {
      return balances[buildSolBalanceKey(token)] || "0";
    },
    [balances],
  );

  return {
    loading,
    getTokenBalance,
    refresh,
  };
}
