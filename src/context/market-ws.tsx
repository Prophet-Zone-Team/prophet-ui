"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  buildMarketTokenKey,
  normalizeMarketTokenIds,
} from "@/lib/market/market-token-ids";
import { getPolymarketMarketWsClient } from "@/lib/market/polymarket-market-ws-client";
import type { MarketOrderbook } from "@/lib/market/orderbook-levels";
import type {
  PolymarketMarketWsEvent,
  TokenBestPrices,
} from "@/types/polymarket-market-ws";

interface MarketWsContextValue {
  pricesByTokenId: Record<string, TokenBestPrices>;
  connected: boolean;
  revision: number;
}

const MarketWsContext = createContext<MarketWsContextValue | null>(null);

export interface MarketWsProviderProps {
  children: ReactNode;
  enabled?: boolean;
  customFeatureEnabled?: boolean;
}

function collectEventAssetIds(event: PolymarketMarketWsEvent): Set<string> {
  const assetIds = new Set<string>();

  switch (event.event_type) {
    case "book":
    case "last_trade_price":
    case "best_bid_ask":
    case "tick_size_change":
      assetIds.add(event.asset_id);
      break;
    case "price_change":
      for (const change of event.price_changes) {
        assetIds.add(change.asset_id);
      }
      break;
    default:
      break;
  }

  return assetIds;
}

function syncPricesFromClient(
  tokenIds: string[]
): Record<string, TokenBestPrices> {
  const client = getPolymarketMarketWsClient();
  const next: Record<string, TokenBestPrices> = {};

  for (const tokenId of tokenIds) {
    const cached = client.getTokenPrices(tokenId);

    if (cached) {
      next[tokenId] = cached;
    }
  }

  return next;
}

function pricesRecordChanged(
  current: Record<string, TokenBestPrices>,
  next: Record<string, TokenBestPrices>,
  tokenIds: string[]
): boolean {
  for (const tokenId of tokenIds) {
    const currentPrices = current[tokenId];
    const nextPrices = next[tokenId];

    if (
      currentPrices?.bestBid !== nextPrices?.bestBid ||
      currentPrices?.bestAsk !== nextPrices?.bestAsk ||
      currentPrices?.lastTradePrice !== nextPrices?.lastTradePrice
    ) {
      return true;
    }
  }

  return false;
}

function registrationsEqual(
  left: readonly string[] | undefined,
  right: readonly string[]
): boolean {
  return (
    left?.length === right.length &&
    Boolean(left?.every((id, index) => id === right[index]))
  );
}

function collectUnionTokenIds(
  registrations: Record<string, readonly string[]>
): string[] {
  const unique = new Set<string>();

  for (const tokenIds of Object.values(registrations)) {
    for (const tokenId of tokenIds) {
      if (tokenId) {
        unique.add(tokenId);
      }
    }
  }

  return [...unique].sort();
}

export function MarketWsProvider({
  children,
  enabled = true,
  customFeatureEnabled = true,
}: MarketWsProviderProps) {
  const [registrations, setRegistrations] = useState<
    Record<string, readonly string[]>
  >({});
  const registrationsRef = useRef<Record<string, readonly string[]>>({});
  const [pricesByTokenId, setPricesByTokenId] = useState<
    Record<string, TokenBestPrices>
  >({});
  const [connected, setConnected] = useState(false);
  const [revision, setRevision] = useState(0);

  const unionTokenIds = useMemo(
    () => collectUnionTokenIds(registrations),
    [registrations]
  );

  const unionTokenKey = buildMarketTokenKey(unionTokenIds);

  const registerTokensSync = useCallback((scopeId: string, tokenIds: string[]) => {
    const nextIds = normalizeMarketTokenIds(tokenIds);

    if (registrationsEqual(registrationsRef.current[scopeId], nextIds)) {
      return;
    }

    registrationsRef.current = {
      ...registrationsRef.current,
      [scopeId]: nextIds,
    };
  }, []);

  const unregisterScope = useCallback((scopeId: string) => {
    if (!(scopeId in registrationsRef.current)) {
      return;
    }

    const next = { ...registrationsRef.current };
    delete next[scopeId];
    registrationsRef.current = next;
  }, []);

  useLayoutEffect(() => {
    const nextRegistrations = { ...registrationsRef.current };
    const nextUnionKey = buildMarketTokenKey(
      collectUnionTokenIds(nextRegistrations)
    );

    if (nextUnionKey === unionTokenKey) {
      return;
    }

    setRegistrations(nextRegistrations);
  });

  const registrationContextValue = useMemo(
    () => ({
      registerTokensSync,
      unregisterScope,
    }),
    [registerTokensSync, unregisterScope]
  );

  useEffect(() => {
    if (!enabled || unionTokenIds.length === 0) {
      setPricesByTokenId((current) =>
        Object.keys(current).length === 0 ? current : {}
      );
      setConnected(false);
      return;
    }

    const activeTokenIds = unionTokenIds;
    const client = getPolymarketMarketWsClient();

    const syncFromCache = () => {
      const next = syncPricesFromClient(activeTokenIds);

      setPricesByTokenId((current) => {
        if (!pricesRecordChanged(current, next, activeTokenIds)) {
          return current;
        }

        const pruned: Record<string, TokenBestPrices> = {};

        for (const tokenId of activeTokenIds) {
          if (next[tokenId]) {
            pruned[tokenId] = next[tokenId];
          }
        }

        return pruned;
      });
    };

    const handleEvent = (event: PolymarketMarketWsEvent) => {
      const assetIds = collectEventAssetIds(event);
      const touched = activeTokenIds.some((tokenId) => assetIds.has(tokenId));

      if (!touched) {
        return;
      }

      syncFromCache();
      setRevision((value) => value + 1);
    };

    syncFromCache();

    const unsubscribeEvents = client.subscribe(activeTokenIds, handleEvent, {
      customFeatureEnabled,
    });
    const unsubscribeConnection = client.onConnectionChange((next) => {
      setConnected((current) => (current === next ? current : next));
    });

    return () => {
      unsubscribeEvents();
      unsubscribeConnection();
    };
  }, [customFeatureEnabled, enabled, unionTokenKey]);

  const contextValue = useMemo(
    () => ({
      pricesByTokenId,
      connected,
      revision,
    }),
    [connected, pricesByTokenId, revision]
  );

  return (
    <MarketWsRegistrationContext.Provider value={registrationContextValue}>
      <MarketWsContext.Provider value={contextValue}>
        {children}
      </MarketWsContext.Provider>
    </MarketWsRegistrationContext.Provider>
  );
}

interface MarketWsRegistrationContextValue {
  registerTokensSync: (scopeId: string, tokenIds: string[]) => void;
  unregisterScope: (scopeId: string) => void;
}

const MarketWsRegistrationContext =
  createContext<MarketWsRegistrationContextValue | null>(null);

export interface UseRegisterMarketWsTokensOptions {
  enabled?: boolean;
}

export function useRegisterMarketWsTokens(
  scopeId: string,
  tokenIds: Array<string | undefined>,
  options: UseRegisterMarketWsTokensOptions = {}
): void {
  const { enabled = true } = options;
  const registration = useContext(MarketWsRegistrationContext);
  const activeTokenIds = enabled ? normalizeMarketTokenIds(tokenIds) : [];

  if (registration) {
    registration.registerTokensSync(scopeId, activeTokenIds);
  }

  useEffect(() => {
    return () => {
      registration?.unregisterScope(scopeId);
    };
  }, [registration, scopeId]);
}

export function useMarketWsContext(): MarketWsContextValue | null {
  return useContext(MarketWsContext);
}

export function useMarketWsPrices(
  tokenIds: Array<string | undefined>
): Pick<MarketWsContextValue, "pricesByTokenId" | "connected"> {
  const context = useMarketWsContext();
  const tokenKey = buildMarketTokenKey(tokenIds);

  return useMemo(() => {
    if (!context) {
      return {
        pricesByTokenId: {},
        connected: false,
      };
    }

    if (!tokenKey) {
      return {
        pricesByTokenId: {},
        connected: context.connected,
      };
    }

    const activeTokenIds = tokenKey.split("|");
    const filtered: Record<string, TokenBestPrices> = {};

    for (const tokenId of activeTokenIds) {
      const prices = context.pricesByTokenId[tokenId];

      if (prices) {
        filtered[tokenId] = prices;
      }
    }

    return {
      pricesByTokenId: filtered,
      connected: context.connected,
    };
  }, [context?.connected, context?.pricesByTokenId, context?.revision, tokenKey]);
}

export function useMarketWsOrderbook(
  tokenId: string | undefined
): MarketOrderbook | undefined {
  const context = useMarketWsContext();
  const revision = context?.revision ?? 0;

  return useMemo(() => {
    if (!tokenId) {
      return undefined;
    }

    return getPolymarketMarketWsClient().getOrderbook(tokenId);
    // revision forces re-read after WS events
  }, [revision, tokenId]);
}
