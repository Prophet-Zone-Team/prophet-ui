"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { fetchBridgeQuote } from "@/lib/funding/bridge-quote";
import type { BridgeQuoteRequest, BridgeQuoteResponse } from "@/types/funding";

export interface UseBridgeQuoteOptions {
  request: BridgeQuoteRequest | undefined;
  enabled?: boolean;
  debounceMs?: number;
}

export interface UseBridgeQuoteResult {
  quote: BridgeQuoteResponse | undefined;
  loading: boolean;
  error: string | undefined;
  reload: () => Promise<void>;
}

export function useBridgeQuote(options: UseBridgeQuoteOptions): UseBridgeQuoteResult {
  const { request, enabled = true, debounceMs = 300 } = options;
  const [quote, setQuote] = useState<BridgeQuoteResponse | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const abortRef = useRef<AbortController | undefined>(undefined);

  const requestKey = request
    ? `${request.fromChainId}:${request.fromTokenAddress}:${request.fromAmountBaseUnit}:${request.toChainId}:${request.toTokenAddress}`
    : "";

  const reload = useCallback(async () => {
    if (!request || !enabled) {
      setQuote(undefined);
      setLoading(false);
      setError(undefined);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(undefined);

    try {
      const response = await fetchBridgeQuote(request, controller.signal);

      if (!controller.signal.aborted) {
        setQuote(response);
      }
    } catch (fetchError) {
      if (controller.signal.aborted || isAbortError(fetchError)) {
        return;
      }

      setQuote(undefined);
      setError(fetchError instanceof Error ? fetchError.message : String(fetchError));
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [enabled, request]);

  useEffect(() => {
    if (!enabled || !request) {
      setQuote(undefined);
      setLoading(false);
      setError(undefined);
      return;
    }

    const timer = window.setTimeout(() => {
      void reload();
    }, debounceMs);

    return () => {
      window.clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [debounceMs, enabled, reload, requestKey]);

  return {
    quote,
    loading,
    error,
    reload,
  };
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}
