"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Big from "big.js";

import { FUNDING_NETWORKS } from "@/config/funding/networks";
import type { FundingToken } from "@/config/funding/tokens";
import { getTronFundingWalletInstance } from "@/lib/wallet/tron/funding-wallet-instance";
import { useFundingWalletStore } from "@/store/use-funding-wallet-store";

const EMPTY_BALANCES: Record<string, string> = {};

function buildTronBalanceKey(token: Pick<FundingToken, "chainId" | "address">): string {
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

export interface UseTronBalancesOptions {
  enabled?: boolean;
  tokens?: FundingToken[];
}

export interface UseTronBalancesResult {
  loading: boolean;
  getTokenBalance: (token: Pick<FundingToken, "chainId" | "address" | "symbol" | "decimals">) => string;
  refresh: () => Promise<void>;
}

export function useTronBalances(options: UseTronBalancesOptions = {}): UseTronBalancesResult {
  const { enabled = true, tokens = [] } = options;
  const [balances, setBalances] = useState<Record<string, string>>(EMPTY_BALANCES);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);
  const address = useFundingWalletStore((state) =>
    state.tron.connected ? state.tron.address : undefined,
  );

  const tronTokenKey = useMemo(
    () =>
      tokens
        .filter((token) => token.chainId === FUNDING_NETWORKS.tron.chainId)
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
    if (!enabled || !tronTokenKey || !address) {
      clearBalances();
      setLoading(false);
      return;
    }

    const wallet = getTronFundingWalletInstance();

    if (!wallet) {
      clearBalances();
      setLoading(false);
      return;
    }

    const tronTokens = tokens.filter(
      (token) => token.chainId === FUNDING_NETWORKS.tron.chainId,
    );

    const requestId = ++requestIdRef.current;
    setLoading(true);

    try {
      const nextBalances: Record<string, string> = {};

      await Promise.all(
        tronTokens.map(async (token) => {
          const rawBalance = await wallet.balanceOf({
            address,
            symbol: token.symbol,
            tokenAddress: token.address,
          });
          const decimalBalance = Big(rawBalance).div(10 ** token.decimals).toFixed(token.decimals);
          nextBalances[buildTronBalanceKey(token)] = decimalBalance;
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
  }, [address, clearBalances, enabled, tokens, tronTokenKey]);

  useEffect(() => {
    void refresh();
  }, [address, enabled, refresh, tronTokenKey]);

  const getTokenBalance = useCallback(
    (token: Pick<FundingToken, "chainId" | "address" | "symbol" | "decimals">) => {
      return balances[buildTronBalanceKey(token)] || "0";
    },
    [balances],
  );

  return {
    loading,
    getTokenBalance,
    refresh,
  };
}
