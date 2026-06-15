"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { create } from "zustand";

import { probabilityFromAsk } from "@/lib/market/merge-live-outcome-prices";
import type { FixtureMarketOutcome, TeamMarketSnapshot } from "@/types/market";

// --- Constants ---

const POLYMARKET_RTDS_WS_URL = "wss://ws-live-data.polymarket.com";
const RTDS_PING_INTERVAL_MS = 5_000;
const RTDS_RECONNECT_BASE_MS = 1_000;
const RTDS_RECONNECT_MAX_MS = 30_000;
const RTDS_DISPOSE_DELAY_MS = 250;

const RTDS_ACTIVITY_TOPIC = "activity";
const RTDS_TRADE_TYPES = ["trades", "orders_matched"] as const;

export const WORLD_CUP_WINNER_EVENT_SLUG = "world-cup-winner";

const EMPTY_RTDS_EVENT_SLUGS: string[] = [];
const EMPTY_LIVE_PRICES: Record<string, number> = {};

// --- Types ---

export type MarketLivePriceConnectionStatus =
  | "idle"
  | "connecting"
  | "open"
  | "error";

export interface RtdsTradePayload {
  conditionId?: string;
  price?: number;
  outcome?: string;
  outcomeIndex?: number;
  eventSlug?: string;
}

export interface ParsedRtdsTrade {
  conditionId: string;
  price: number;
}

type RtdsTradeListener = (trade: ParsedRtdsTrade) => void;

interface MarketLivePriceStore {
  pricesByConditionId: Record<string, number>;
  updatedAtByConditionId: Record<string, number>;
  revision: number;
  connectionStatus: MarketLivePriceConnectionStatus;
  setPrice: (conditionId: string, price: number) => void;
  setConnectionStatus: (status: MarketLivePriceConnectionStatus) => void;
  clear: () => void;
}

// --- Parse / resolve (exported for tests) ---

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readFinitePrice(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function isValidConditionId(value: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(value);
}

export function buildRtdsEventSlugFilter(eventSlug: string): string {
  return JSON.stringify({ event_slug: eventSlug.trim() });
}

export function normalizeTradePriceToYes(payload: RtdsTradePayload): number | undefined {
  const price = readFinitePrice(payload.price);

  if (price === undefined || price <= 0 || price >= 1) {
    return undefined;
  }

  const outcome = payload.outcome?.trim().toLowerCase();

  if (payload.outcomeIndex === 1 || outcome === "no") {
    return 1 - price;
  }

  return price;
}

export function parseRtdsTradeMessage(raw: unknown): ParsedRtdsTrade | undefined {
  if (!isRecord(raw)) {
    return undefined;
  }

  if (raw.topic !== RTDS_ACTIVITY_TOPIC) {
    return undefined;
  }

  if (raw.type !== "trades" && raw.type !== "orders_matched") {
    return undefined;
  }

  const payload = raw.payload;

  if (!isRecord(payload)) {
    return undefined;
  }

  const conditionId =
    typeof payload.conditionId === "string" ? payload.conditionId.trim() : "";

  if (!isValidConditionId(conditionId)) {
    return undefined;
  }

  const price = normalizeTradePriceToYes(payload as RtdsTradePayload);

  if (price === undefined) {
    return undefined;
  }

  return { conditionId, price };
}

export function livePriceToProbability(price: number | undefined): number | undefined {
  return probabilityFromAsk(price);
}

export function resolveLiveMarketPrice(
  conditionId: string | undefined,
  fallbackPrice: number | undefined,
  pricesByConditionId: Record<string, number>,
): number | undefined {
  const trimmed = conditionId?.trim();

  if (trimmed) {
    const live = pricesByConditionId[trimmed];

    if (live !== undefined && live > 0 && live < 1) {
      return live;
    }
  }

  return fallbackPrice;
}

export function resolveLiveMarketProbability(
  conditionId: string | undefined,
  fallbackProbability: number,
  pricesByConditionId: Record<string, number>,
): number {
  const livePrice = resolveLiveMarketPrice(conditionId, undefined, pricesByConditionId);

  if (livePrice !== undefined) {
    return livePriceToProbability(livePrice) ?? fallbackProbability;
  }

  return fallbackProbability;
}

export function normalizeEventSlugs(slugs: Array<string | undefined>): string[] {
  const unique = new Set<string>();

  for (const slug of slugs) {
    const trimmed = slug?.trim();

    if (trimmed) {
      unique.add(trimmed);
    }
  }

  return [...unique].sort();
}

function buildEventSlugKey(slugs: readonly string[]): string {
  return slugs.join("|");
}

function registrationsEqual(
  left: readonly string[] | undefined,
  right: readonly string[],
): boolean {
  return (
    left?.length === right.length &&
    Boolean(left?.every((slug, index) => slug === right[index]))
  );
}

function collectUnionEventSlugs(
  registrations: Record<string, readonly string[]>,
): string[] {
  const unique = new Set<string>();

  for (const slugs of Object.values(registrations)) {
    for (const slug of slugs) {
      if (slug) {
        unique.add(slug);
      }
    }
  }

  return [...unique].sort();
}

// --- Zustand store ---

export const useMarketLivePriceStore = create<MarketLivePriceStore>()((set, get) => ({
  pricesByConditionId: {},
  updatedAtByConditionId: {},
  revision: 0,
  connectionStatus: "idle",

  setPrice: (conditionId, price) => {
    const trimmed = conditionId.trim();

    if (!isValidConditionId(trimmed) || price <= 0 || price >= 1) {
      return;
    }

    const current = get().pricesByConditionId[trimmed];

    if (current === price) {
      return;
    }

    set((state) => ({
      pricesByConditionId: {
        ...state.pricesByConditionId,
        [trimmed]: price,
      },
      updatedAtByConditionId: {
        ...state.updatedAtByConditionId,
        [trimmed]: Date.now(),
      },
      revision: state.revision + 1,
    }));
  },

  setConnectionStatus: (status) => {
    set((state) =>
      state.connectionStatus === status ? state : { connectionStatus: status },
    );
  },

  clear: () => {
    set({
      pricesByConditionId: {},
      updatedAtByConditionId: {},
      revision: 0,
      connectionStatus: "idle",
    });
  },
}));

// --- RTDS WebSocket client ---

function buildSubscriptionEntries(eventSlug: string) {
  const filters = buildRtdsEventSlugFilter(eventSlug);

  return RTDS_TRADE_TYPES.map((type) => ({
    topic: RTDS_ACTIVITY_TOPIC,
    type,
    filters,
  }));
}

function buildSubscriptionKey(eventSlug: string, type: string): string {
  return `${eventSlug}::${type}`;
}

class PolymarketRtdsWsClient {
  private socket: WebSocket | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private disposeTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private disposed = false;
  private readonly listeners = new Set<RtdsTradeListener>();
  private readonly activeSlugs = new Set<string>();
  private readonly subscribedKeys = new Set<string>();

  subscribe(listener: RtdsTradeListener): () => void {
    this.resetIfDisposed();
    this.listeners.add(listener);
    this.ensureConnection();

    return () => {
      this.listeners.delete(listener);
      this.scheduleDisposeIfIdle();
    };
  }

  setEventSlugs(slugs: string[]): void {
    this.resetIfDisposed();
    const nextSlugs = new Set(normalizeEventSlugs(slugs));
    const removed = [...this.activeSlugs].filter((slug) => !nextSlugs.has(slug));
    const added = [...nextSlugs].filter((slug) => !this.activeSlugs.has(slug));

    this.activeSlugs.clear();

    for (const slug of nextSlugs) {
      this.activeSlugs.add(slug);
    }

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.sendUnsubscribe(removed);
      this.sendSubscribe(added);
    }
  }

  private resetIfDisposed(): void {
    if (!this.disposed) {
      return;
    }

    this.disposed = false;
    this.reconnectAttempt = 0;
  }

  private scheduleDisposeIfIdle(): void {
    if (this.listeners.size > 0) {
      return;
    }

    this.clearDisposeTimer();
    this.disposeTimer = setTimeout(() => {
      if (this.listeners.size === 0) {
        this.dispose();
      }
    }, RTDS_DISPOSE_DELAY_MS);
  }

  private clearDisposeTimer(): void {
    if (this.disposeTimer) {
      clearTimeout(this.disposeTimer);
      this.disposeTimer = null;
    }
  }

  private dispose(): void {
    this.disposed = true;
    this.clearReconnectTimer();
    this.clearPingTimer();
    this.clearDisposeTimer();
    this.activeSlugs.clear();
    this.subscribedKeys.clear();

    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onerror = null;
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }
  }

  private ensureConnection(): void {
    if (this.disposed || this.listeners.size === 0) {
      return;
    }

    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.connect();
  }

  private connect(): void {
    if (this.disposed || typeof WebSocket === "undefined") {
      return;
    }

    this.clearReconnectTimer();
    useMarketLivePriceStore.getState().setConnectionStatus("connecting");

    const socket = new WebSocket(POLYMARKET_RTDS_WS_URL);
    this.socket = socket;

    socket.onopen = () => {
      this.reconnectAttempt = 0;
      useMarketLivePriceStore.getState().setConnectionStatus("open");
      this.startPing();
      this.sendSubscribe([...this.activeSlugs]);
    };

    socket.onmessage = (message) => {
      const data = String(message.data);

      if (data === "pong" || data === "PONG") {
        return;
      }

      let parsed: unknown;

      try {
        parsed = JSON.parse(data);
      } catch {
        return;
      }

      const trade = parseRtdsTradeMessage(parsed);

      if (!trade) {
        return;
      }

      useMarketLivePriceStore.getState().setPrice(trade.conditionId, trade.price);

      for (const listener of this.listeners) {
        listener(trade);
      }
    };

    socket.onerror = () => {
      useMarketLivePriceStore.getState().setConnectionStatus("error");
    };

    socket.onclose = () => {
      this.socket = null;
      this.clearPingTimer();
      this.subscribedKeys.clear();
      useMarketLivePriceStore.getState().setConnectionStatus("idle");
      this.scheduleReconnect();
    };
  }

  private sendSubscribe(eventSlugs: string[]): void {
    if (!eventSlugs.length || this.socket?.readyState !== WebSocket.OPEN) {
      return;
    }

    const subscriptions = eventSlugs.flatMap((eventSlug) => {
      return buildSubscriptionEntries(eventSlug).filter((entry) => {
        const key = buildSubscriptionKey(eventSlug, entry.type);

        if (this.subscribedKeys.has(key)) {
          return false;
        }

        this.subscribedKeys.add(key);
        return true;
      });
    });

    if (subscriptions.length === 0) {
      return;
    }

    this.socket?.send(
      JSON.stringify({
        action: "subscribe",
        subscriptions,
      }),
    );
  }

  private sendUnsubscribe(eventSlugs: string[]): void {
    if (!eventSlugs.length || this.socket?.readyState !== WebSocket.OPEN) {
      for (const eventSlug of eventSlugs) {
        for (const type of RTDS_TRADE_TYPES) {
          this.subscribedKeys.delete(buildSubscriptionKey(eventSlug, type));
        }
      }

      return;
    }

    const subscriptions = eventSlugs.flatMap((eventSlug) =>
      RTDS_TRADE_TYPES.map((type) => {
        this.subscribedKeys.delete(buildSubscriptionKey(eventSlug, type));

        return {
          topic: RTDS_ACTIVITY_TOPIC,
          type,
          filters: buildRtdsEventSlugFilter(eventSlug),
        };
      }),
    );

    this.socket.send(
      JSON.stringify({
        action: "unsubscribe",
        subscriptions,
      }),
    );
  }

  private startPing(): void {
    this.clearPingTimer();
    this.pingTimer = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send("ping");
      }
    }, RTDS_PING_INTERVAL_MS);
  }

  private clearPingTimer(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.disposed || this.listeners.size === 0) {
      return;
    }

    this.clearReconnectTimer();

    const delay = Math.min(
      RTDS_RECONNECT_BASE_MS * 2 ** this.reconnectAttempt,
      RTDS_RECONNECT_MAX_MS,
    );

    this.reconnectAttempt += 1;

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

let rtdsClientInstance: PolymarketRtdsWsClient | null = null;

function getPolymarketRtdsWsClient(): PolymarketRtdsWsClient {
  if (!rtdsClientInstance) {
    rtdsClientInstance = new PolymarketRtdsWsClient();
  }

  return rtdsClientInstance;
}

// --- Provider + registration ---

interface RtdsRegistrationContextValue {
  registerEventSlugsSync: (scopeId: string, slugs: string[]) => void;
  unregisterScope: (scopeId: string) => void;
}

const RtdsRegistrationContext = createContext<RtdsRegistrationContextValue | null>(
  null,
);

export interface MarketLivePriceWsProviderProps {
  children: ReactNode;
  enabled?: boolean;
}

export function MarketLivePriceWsProvider({
  children,
  enabled = true,
}: MarketLivePriceWsProviderProps) {
  const [registrations, setRegistrations] = useState<
    Record<string, readonly string[]>
  >({});

  const unionEventSlugs = useMemo(
    () => collectUnionEventSlugs(registrations),
    [registrations],
  );
  const unionEventSlugKey = buildEventSlugKey(unionEventSlugs);

  const registerEventSlugsSync = useCallback((scopeId: string, slugs: string[]) => {
    const nextSlugs = normalizeEventSlugs(slugs);

    setRegistrations((current) => {
      if (registrationsEqual(current[scopeId], nextSlugs)) {
        return current;
      }

      return {
        ...current,
        [scopeId]: nextSlugs,
      };
    });
  }, []);

  const unregisterScope = useCallback((scopeId: string) => {
    setRegistrations((current) => {
      if (!(scopeId in current)) {
        return current;
      }

      const next = { ...current };
      delete next[scopeId];
      return next;
    });
  }, []);

  const registrationContextValue = useMemo(
    () => ({
      registerEventSlugsSync,
      unregisterScope,
    }),
    [registerEventSlugsSync, unregisterScope],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const client = getPolymarketRtdsWsClient();

    return client.subscribe(() => {
      // Store updates happen inside the client message handler.
    });
  }, [enabled]);

  useEffect(() => {
    const client = getPolymarketRtdsWsClient();

    if (!enabled) {
      client.setEventSlugs([]);
      useMarketLivePriceStore.getState().clear();
      return;
    }

    client.setEventSlugs(unionEventSlugs);

    return () => {
      client.setEventSlugs([]);
      useMarketLivePriceStore.getState().clear();
    };
  }, [enabled, unionEventSlugKey]);

  return (
    <RtdsRegistrationContext.Provider value={registrationContextValue}>
      {children}
    </RtdsRegistrationContext.Provider>
  );
}

export interface UseRegisterRtdsEventSlugsOptions {
  enabled?: boolean;
}

export function useRegisterRtdsEventSlugs(
  scopeId: string,
  slugs: Array<string | undefined>,
  options: UseRegisterRtdsEventSlugsOptions = {},
): void {
  const { enabled = true } = options;
  const registration = useContext(RtdsRegistrationContext);
  const eventSlugsKey = buildEventSlugKey(normalizeEventSlugs(slugs));
  const normalizedSlugs = useMemo(
    () => normalizeEventSlugs(slugs),
    [eventSlugsKey],
  );

  useEffect(() => {
    if (!registration) {
      return;
    }

    registration.registerEventSlugsSync(
      scopeId,
      enabled ? normalizedSlugs : EMPTY_RTDS_EVENT_SLUGS,
    );
  }, [enabled, normalizedSlugs, registration, scopeId]);

  useEffect(() => {
    return () => {
      registration?.unregisterScope(scopeId);
    };
  }, [registration, scopeId]);
}

// --- Consumer hooks ---

export function useMarketLivePriceRevision(): number {
  return useMarketLivePriceStore((state) => state.revision);
}

export function useLiveMarketPrice(
  conditionId: string | undefined,
  fallbackPrice: number,
): number {
  const trimmed = conditionId?.trim();
  const livePrice = useMarketLivePriceStore((state) =>
    trimmed ? state.pricesByConditionId[trimmed] : undefined,
  );

  return (
    resolveLiveMarketPrice(
      conditionId,
      fallbackPrice,
      trimmed && livePrice !== undefined
        ? { [trimmed]: livePrice }
        : EMPTY_LIVE_PRICES,
    ) ?? fallbackPrice
  );
}

export function useLiveMarketProbability(
  conditionId: string | undefined,
  fallbackProbability: number,
): number {
  const trimmed = conditionId?.trim();
  const livePrice = useMarketLivePriceStore((state) =>
    trimmed ? state.pricesByConditionId[trimmed] : undefined,
  );
  const pricesByConditionId =
    trimmed && livePrice !== undefined
      ? { [trimmed]: livePrice }
      : EMPTY_LIVE_PRICES;

  return resolveLiveMarketProbability(
    conditionId,
    fallbackProbability,
    pricesByConditionId,
  );
}

export function useLiveTeamSnapshot(snapshot: TeamMarketSnapshot): TeamMarketSnapshot {
  const conditionId = snapshot.market.polymarket?.conditionId;
  const fallbackYesPrice =
    snapshot.market.polymarket?.tokens.yes?.price ??
    snapshot.market.probability / 100;
  const liveYesPrice = useLiveMarketPrice(conditionId, fallbackYesPrice);
  const liveProbability = useLiveMarketProbability(
    conditionId,
    snapshot.market.probability,
  );
  const liveNoPrice =
    liveYesPrice > 0 && liveYesPrice < 1 ? 1 - liveYesPrice : undefined;

  return useMemo(() => {
    const polymarket = snapshot.market.polymarket;
    const yesChanged =
      polymarket?.tokens.yes?.price !== undefined
        ? liveYesPrice !== polymarket.tokens.yes.price
        : liveProbability !== snapshot.market.probability;
    const noChanged =
      polymarket?.tokens.no?.price !== undefined &&
      liveNoPrice !== undefined &&
      liveNoPrice !== polymarket.tokens.no.price;

    if (
      liveProbability === snapshot.market.probability &&
      !yesChanged &&
      !noChanged
    ) {
      return snapshot;
    }

    return {
      ...snapshot,
      market: {
        ...snapshot.market,
        probability: liveProbability,
        polymarket: polymarket
          ? {
              ...polymarket,
              tokens: {
                ...polymarket.tokens,
                yes: polymarket.tokens.yes
                  ? {
                      ...polymarket.tokens.yes,
                      price: liveYesPrice,
                    }
                  : undefined,
                no: polymarket.tokens.no
                  ? {
                      ...polymarket.tokens.no,
                      price:
                        liveNoPrice ??
                        polymarket.tokens.no.price ??
                        Math.max(0.001, 1 - liveYesPrice),
                    }
                  : undefined,
              },
            }
          : polymarket,
      },
    };
  }, [liveNoPrice, liveProbability, liveYesPrice, snapshot]);
}

export function useLiveFixtureOutcome(
  outcome: FixtureMarketOutcome,
): FixtureMarketOutcome {
  const liveYesPrice = useLiveMarketPrice(
    outcome.conditionId,
    outcome.yesAsk ?? outcome.price ?? outcome.probability / 100,
  );
  const liveProbability = livePriceToProbability(liveYesPrice) ?? outcome.probability;

  return useMemo(() => {
    const nextYesAsk = liveYesPrice;
    const nextNoAsk =
      liveYesPrice > 0 && liveYesPrice < 1 ? 1 - liveYesPrice : outcome.noAsk;

    if (
      nextYesAsk === outcome.yesAsk &&
      nextNoAsk === outcome.noAsk &&
      liveProbability === outcome.probability
    ) {
      return outcome;
    }

    return {
      ...outcome,
      yesAsk: nextYesAsk,
      noAsk: nextNoAsk,
      price: nextYesAsk,
      probability: liveProbability,
    };
  }, [liveProbability, liveYesPrice, outcome]);
}

export function useMarketLivePricesByConditionId(): Record<string, number> {
  return useMarketLivePriceStore((state) => state.pricesByConditionId);
}
