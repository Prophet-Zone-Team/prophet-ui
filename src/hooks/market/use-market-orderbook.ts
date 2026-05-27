"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { POLYMARKET_MARKET_WS_INITIAL_TIMEOUT_MS } from "@/config/polymarket-ws";
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

export function useMarketOrderbook(
  tokenId: string | undefined
): UseMarketOrderbookResult {
  const [book, setBook] = useState<MarketOrderbook | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [connected, setConnected] = useState(false);
  const receivedWsBookRef = useRef(false);
  const fallbackAttemptedRef = useRef(false);

  const runFallback = useCallback(async (activeTokenId: string) => {
    if (fallbackAttemptedRef.current) {
      return;
    }

    fallbackAttemptedRef.current = true;
    setLoading(true);

    try {
      const nextBook = await fetchOrderbookFallback(activeTokenId);
      setBook((current) => current ?? nextBook);
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
    if (!tokenId) {
      setBook(undefined);
      setError(undefined);
      setLoading(false);
      setConnected(false);
      receivedWsBookRef.current = false;
      fallbackAttemptedRef.current = false;
      return;
    }

    const activeTokenId = tokenId;
    receivedWsBookRef.current = false;
    fallbackAttemptedRef.current = false;
    setBook(undefined);
    setError(undefined);
    setLoading(true);

    const client = getPolymarketMarketWsClient();

    const handleEvent = (event: PolymarketMarketWsEvent) => {
      if (event.event_type === "book" && event.asset_id === activeTokenId) {
        receivedWsBookRef.current = true;
        setBook(bookEventToMarketOrderbook(event));
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

        setBook((current) => {
          const next = applyPriceChangeEvent(current, event);

          if (next?.tokenId === activeTokenId) {
            receivedWsBookRef.current = true;
            setLoading(false);
            setError(undefined);
            return next;
          }

          return current;
        });
      }
    };

    const unsubscribeEvents = client.subscribe([activeTokenId], handleEvent);
    const unsubscribeConnection = client.onConnectionChange(setConnected);

    const cached = client.getOrderbook(activeTokenId);

    if (cached) {
      receivedWsBookRef.current = true;
      setBook(cached);
      setLoading(false);
    }

    const fallbackTimer = window.setTimeout(() => {
      if (!receivedWsBookRef.current) {
        void runFallback(activeTokenId);
      }
    }, POLYMARKET_MARKET_WS_INITIAL_TIMEOUT_MS);

    return () => {
      window.clearTimeout(fallbackTimer);
      unsubscribeEvents();
      unsubscribeConnection();
    };
  }, [runFallback, tokenId]);

  return {
    book,
    loading,
    error,
    connected,
  };
}
