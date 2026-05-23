"use client";

import { useCallback, useEffect, useRef } from "react";

import {
  FUNDING_TOKENS_LIST,
  FundingNetworkType,
  type FundingToken,
} from "@/config/funding";
import { useAuthOptional } from "@/context/auth";
import { selectFundingTokenBalance } from "@/lib/funding/balance-selectors";
import { fetchEvmTokenBalances } from "@/lib/funding/evm-balances";
import { useBalancesStore } from "@/store/use-balances";
import type { EvmBalancesByChain } from "@/types/funding";

const EVM_FUNDING_TOKENS = FUNDING_TOKENS_LIST.filter(
  (token) => token.chainType === FundingNetworkType.EVM,
);

const POLL_INTERVAL_MS = 60_000;
const DEBOUNCE_MS = 5_000;

export interface UseEvmBalancesOptions {
  auto?: boolean;
  enabled?: boolean;
}

export interface UseEvmBalancesResult {
  loading: boolean;
  error: string | undefined;
  evmBalances: EvmBalancesByChain;
  getBalances: () => Promise<void>;
  getTokenBalance: (token: FundingToken) => Promise<string>;
}

export function useEvmBalances(options: UseEvmBalancesOptions = {}): UseEvmBalancesResult {
  const { auto = false, enabled = true } = options;
  const auth = useAuthOptional();
  const walletAddress = auth?.session?.walletAddress;

  const evmBalances = useBalancesStore((state) => state.evmBalances);
  const loading = useBalancesStore((state) => state.loading);
  const error = useBalancesStore((state) => state.error);
  const setEvmBalances = useBalancesStore((state) => state.setEvmBalances);
  const setLoading = useBalancesStore((state) => state.setLoading);
  const setError = useBalancesStore((state) => state.setError);
  const patchEvmTokenBalance = useBalancesStore((state) => state.patchEvmTokenBalance);
  const clearEvmBalances = useBalancesStore((state) => state.clearEvmBalances);

  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const singleTokenAbortRef = useRef<AbortController | null>(null);
  const singleTokenRequestIdRef = useRef(0);
  const initRef = useRef(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getBalances = useCallback(async () => {
    if (!walletAddress) {
      return;
    }

    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const currentRequestId = ++requestIdRef.current;

    const isRequestStale = () =>
      abortController.signal.aborted || currentRequestId !== requestIdRef.current;

    setLoading(true);
    setError(undefined);

    try {
      const byChain = await fetchEvmTokenBalances(walletAddress, EVM_FUNDING_TOKENS, {
        signal: abortController.signal,
      });

      if (isRequestStale()) {
        return;
      }

      setEvmBalances({
        evmBalances: byChain,
        updatedAt: new Date().toISOString(),
        error: undefined,
      });
    } catch (fetchError) {
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        return;
      }

      if (isRequestStale()) {
        return;
      }

      const message = fetchError instanceof Error ? fetchError.message : String(fetchError);
      setError(message);
      console.warn("[useEvmBalances] get balances failed", fetchError);
    } finally {
      if (!isRequestStale()) {
        setLoading(false);
      }

      initRef.current = true;
    }
  }, [setError, setEvmBalances, setLoading, walletAddress]);

  const getTokenBalance = useCallback(
    async (token: FundingToken) => {
      if (!walletAddress) {
        return "0";
      }

      if (token.chainType !== FundingNetworkType.EVM) {
        return "0";
      }

      singleTokenAbortRef.current?.abort();
      const abortController = new AbortController();
      singleTokenAbortRef.current = abortController;
      const currentRequestId = ++singleTokenRequestIdRef.current;

      const isRequestStale = () =>
        abortController.signal.aborted || currentRequestId !== singleTokenRequestIdRef.current;

      try {
        const byChain = await fetchEvmTokenBalances(walletAddress, [token], {
          signal: abortController.signal,
        });

        const balance = selectFundingTokenBalance(byChain, token);

        if (!isRequestStale()) {
          patchEvmTokenBalance({
            chainId: token.chainId,
            address: token.address,
            balance,
          });
        }

        return balance;
      } catch (fetchError) {
        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          return selectFundingTokenBalance(useBalancesStore.getState().evmBalances, token);
        }

        console.warn("[useEvmBalances] get token balance failed", {
          symbol: token.symbol,
          chainId: token.chainId,
          error: fetchError,
        });

        return selectFundingTokenBalance(useBalancesStore.getState().evmBalances, token);
      }
    },
    [patchEvmTokenBalance, walletAddress],
  );

  const cancelDebouncedGetBalances = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const debouncedGetBalances = useCallback(() => {
    cancelDebouncedGetBalances();
    debounceTimerRef.current = setTimeout(() => {
      void getBalances();
    }, DEBOUNCE_MS);
  }, [cancelDebouncedGetBalances, getBalances]);

  const stopPollingBalances = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const startPollingBalances = useCallback(() => {
    stopPollingBalances();
    pollTimerRef.current = setInterval(() => {
      void getBalances();
    }, POLL_INTERVAL_MS);
  }, [getBalances, stopPollingBalances]);

  useEffect(() => {
    if (!enabled || !walletAddress) {
      clearEvmBalances();
      return;
    }

    if (!initRef.current) {
      debouncedGetBalances();
    }
  }, [clearEvmBalances, debouncedGetBalances, enabled, walletAddress]);

  useEffect(() => {
    if (!enabled || !walletAddress || !auto) {
      stopPollingBalances();
      cancelDebouncedGetBalances();
      return;
    }

    void getBalances();
    startPollingBalances();

    return () => {
      stopPollingBalances();
    };
  }, [
    auto,
    cancelDebouncedGetBalances,
    enabled,
    getBalances,
    startPollingBalances,
    stopPollingBalances,
    walletAddress,
  ]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      singleTokenAbortRef.current?.abort();
      stopPollingBalances();
      cancelDebouncedGetBalances();
    };
  }, [cancelDebouncedGetBalances, stopPollingBalances]);

  return {
    loading,
    error,
    evmBalances,
    getBalances,
    getTokenBalance,
  };
}
