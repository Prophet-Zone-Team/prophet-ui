"use client";

import { useCallback, useEffect, useRef } from "react";

import { fetchTokenPrices } from "@/lib/funding/fetch-token-prices";
import { usePricesStore } from "@/store/use-prices";
import type { TokenPricesBySymbol } from "@/types/funding";

const DEFAULT_POLLING_INTERVAL_MS = 120_000;

export interface UsePricesOptions {
  enabled?: boolean;
  auto?: boolean;
  pollingIntervalMs?: number;
}

export interface UsePricesResult {
  prices: TokenPricesBySymbol;
  loading: boolean;
  error: string | undefined;
  getPrices: () => Promise<void>;
}

export function usePrices(options: UsePricesOptions = {}): UsePricesResult {
  const {
    enabled = true,
    auto = false,
    pollingIntervalMs = DEFAULT_POLLING_INTERVAL_MS,
  } = options;

  const prices = usePricesStore((state) => state.prices);
  const loading = usePricesStore((state) => state.loading);
  const error = usePricesStore((state) => state.error);
  const setPrices = usePricesStore((state) => state.setPrices);
  const setLoading = usePricesStore((state) => state.setLoading);
  const setError = usePricesStore((state) => state.setError);
  const clearPrices = usePricesStore((state) => state.clearPrices);

  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getPrices = useCallback(async () => {
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const currentRequestId = ++requestIdRef.current;

    const isRequestStale = () =>
      abortController.signal.aborted || currentRequestId !== requestIdRef.current;

    setLoading(true);
    setError(undefined);

    try {
      const nextPrices = await fetchTokenPrices(abortController.signal);

      if (isRequestStale()) {
        return;
      }

      setPrices({
        prices: nextPrices,
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
      console.warn("[usePrices] get prices failed", fetchError);
    } finally {
      if (!isRequestStale()) {
        setLoading(false);
      }
    }
  }, [setError, setLoading, setPrices]);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollTimerRef.current = setInterval(() => {
      void getPrices();
    }, pollingIntervalMs);
  }, [getPrices, pollingIntervalMs, stopPolling]);

  useEffect(() => {
    if (!enabled) {
      clearPrices();
      return;
    }

    if (!auto) {
      void getPrices();
    }
  }, [auto, clearPrices, enabled, getPrices]);

  useEffect(() => {
    if (!enabled || !auto) {
      stopPolling();
      return;
    }

    void getPrices();
    startPolling();

    return () => {
      stopPolling();
    };
  }, [auto, enabled, getPrices, startPolling, stopPolling]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      stopPolling();
    };
  }, [stopPolling]);

  return {
    prices,
    loading,
    error,
    getPrices,
  };
}
