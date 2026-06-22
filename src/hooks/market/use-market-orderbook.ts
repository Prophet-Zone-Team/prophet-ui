"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { POLYMARKET_MARKET_WS_INITIAL_TIMEOUT_MS } from "@/config/polymarket-ws";
import { useMarketWsContext, useMarketWsOrderbook } from "@/context/market-ws";
import type { MarketOrderbook } from "@/lib/market/orderbook-levels";
import {
  applyPriceChangeEvent,
  bookEventToMarketOrderbook,
} from "@/lib/market/orderbook-state";
import { getPolymarketMarketWsClient } from "@/lib/market/polymarket-market-ws-client";
import { fetchJson } from "@/lib/team/client-fetch";
import type { PolymarketMarketWsEvent } from "@/types/polymarket-market-ws";

export interface UseMarketOrderbookResult {
  book: MarketOrderbook | undefined;
  loading: boolean;
  error: string | undefined;
  connected: boolean;
}

async function fetchOrderbookFallback(
  tokenId: string
): Promise<MarketOrderbook> {
  const payload = await fetchJson<{ orderbook: MarketOrderbook }>(
    `/api/market/orderbook?tokenId=${encodeURIComponent(tokenId)}`
  );

  return payload.orderbook;
}

function resolveStaleBook(
  staleBook: MarketOrderbook | undefined,
  tokenId: string | undefined
): MarketOrderbook | undefined {
  if (!tokenId || staleBook?.tokenId !== tokenId) {
    return undefined;
  }

  return staleBook;
}

export function useMarketOrderbook(
  tokenId: string | undefined
): UseMarketOrderbookResult {
  const marketWsContext = useMarketWsContext();
  const providerBook = useMarketWsOrderbook(tokenId);
  const [fallbackBook, setFallbackBook] = useState<
    MarketOrderbook | undefined
  >();
  const [standaloneBook, setStandaloneBook] = useState<
    MarketOrderbook | undefined
  >();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [connected, setConnected] = useState(false);
  const fallbackAttemptedRef = useRef(false);
  const marketWsContextRef = useRef(marketWsContext);
  const staleBookRef = useRef<MarketOrderbook | undefined>(undefined);
  const trackedTokenIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (marketWsContext) marketWsContextRef.current = marketWsContext;
  }, [marketWsContext]);

  const runFallback = useCallback(async (activeTokenId: string) => {
    if (fallbackAttemptedRef.current) {
      return;
    }

    fallbackAttemptedRef.current = true;

    if (!resolveStaleBook(staleBookRef.current, activeTokenId)) {
      setLoading(true);
    }

    try {
      const nextBook = await fetchOrderbookFallback(activeTokenId);

      if (marketWsContextRef.current) {
        setFallbackBook(nextBook);
      } else {
        setStandaloneBook(nextBook);
      }

      staleBookRef.current = nextBook;
      setError(undefined);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : String(loadError)
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!marketWsContext) {
      return;
    }

    if (!tokenId) {
      setFallbackBook(undefined);
      setError(undefined);
      setLoading(false);
      fallbackAttemptedRef.current = false;
      trackedTokenIdRef.current = undefined;
      return;
    }

    const activeTokenId = tokenId;
    const tokenChanged = trackedTokenIdRef.current !== activeTokenId;
    trackedTokenIdRef.current = activeTokenId;
    fallbackAttemptedRef.current = false;

    if (tokenChanged) {
      setFallbackBook(undefined);
      setError(undefined);

      const cached = getPolymarketMarketWsClient().getOrderbook(activeTokenId);
      const hasStale = Boolean(resolveStaleBook(staleBookRef.current, activeTokenId));
      setLoading(!cached && !hasStale);
    }

    const fallbackTimer = window.setTimeout(() => {
      const cached = getPolymarketMarketWsClient().getOrderbook(activeTokenId);

      if (!cached) {
        void runFallback(activeTokenId);
      }
    }, POLYMARKET_MARKET_WS_INITIAL_TIMEOUT_MS);

    return () => {
      window.clearTimeout(fallbackTimer);
    };
  }, [marketWsContext, runFallback, tokenId]);

  useEffect(() => {
    if (marketWsContext) {
      return;
    }

    if (!tokenId) {
      setStandaloneBook(undefined);
      setError(undefined);
      setLoading(false);
      setConnected(false);
      fallbackAttemptedRef.current = false;
      trackedTokenIdRef.current = undefined;
      return;
    }

    const activeTokenId = tokenId;
    const tokenChanged = trackedTokenIdRef.current !== activeTokenId;
    trackedTokenIdRef.current = activeTokenId;
    fallbackAttemptedRef.current = false;

    if (tokenChanged) {
      setError(undefined);

      const client = getPolymarketMarketWsClient();
      const cached = client.getOrderbook(activeTokenId);
      const stale = resolveStaleBook(staleBookRef.current, activeTokenId);

      if (cached) {
        setStandaloneBook(cached);
        setLoading(false);
      } else if (stale) {
        setStandaloneBook(stale);
        setLoading(true);
      } else {
        setStandaloneBook(undefined);
        setLoading(true);
      }
    }

    const client = getPolymarketMarketWsClient();

    const handleEvent = (event: PolymarketMarketWsEvent) => {
      if (event.event_type === "book" && event.asset_id === activeTokenId) {
        const nextBook = bookEventToMarketOrderbook(event);
        setStandaloneBook(nextBook);
        staleBookRef.current = nextBook;
        setError(undefined);
        setLoading(false);
        return;
      }

      if (event.event_type === "price_change") {
        const relevant = event.price_changes.some(
          (change) => change.asset_id === activeTokenId
        );

        if (!relevant) {
          return;
        }

        setStandaloneBook((current) => {
          const next = applyPriceChangeEvent(current, event);

          if (next?.tokenId === activeTokenId) {
            staleBookRef.current = next;
            return next;
          }

          return current;
        });
        setLoading(false);
        setError(undefined);
      }
    };

    const unsubscribeEvents = client.subscribe([activeTokenId], handleEvent);
    const unsubscribeConnection = client.onConnectionChange((next) => {
      setConnected((current) => (current === next ? current : next));
    });

    if (!tokenChanged) {
      const cached = client.getOrderbook(activeTokenId);

      if (cached) {
        setStandaloneBook(cached);
        staleBookRef.current = cached;
        setLoading(false);
      }
    }

    const fallbackTimer = window.setTimeout(() => {
      if (!client.getOrderbook(activeTokenId)) {
        void runFallback(activeTokenId);
      }
    }, POLYMARKET_MARKET_WS_INITIAL_TIMEOUT_MS);

    return () => {
      window.clearTimeout(fallbackTimer);
      unsubscribeEvents();
      unsubscribeConnection();
    };
  }, [marketWsContext, runFallback, tokenId]);

  const liveBook = marketWsContext
    ? (providerBook ?? fallbackBook)
    : standaloneBook;

  useEffect(() => {
    if (liveBook?.tokenId === tokenId) {
      staleBookRef.current = liveBook;
      setLoading(false);
    }
  }, [liveBook, tokenId]);

  const book =
    liveBook ?? resolveStaleBook(staleBookRef.current, tokenId);

  return {
    book,
    loading: loading && !book,
    error,
    connected: marketWsContext?.connected ?? connected,
  };
}
