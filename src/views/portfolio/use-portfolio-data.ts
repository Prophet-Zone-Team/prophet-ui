"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/context/auth";
import { mapComboPositionsToCards } from "@/lib/portfolio/combo-positions/map-combo-position-card";
import type { PortfolioComboPositionCard } from "@/lib/portfolio/combo-positions/types";
import { fetchPolymarketComboPositions } from "@/lib/portfolio/fetch-polymarket-combo-positions";
import { PORTFOLIO_HISTORY_PAGE_SIZE } from "@/lib/portfolio/config";
import type { PolymarketActivityRow } from "@/lib/portfolio/fetch-polymarket-activity";
import { fetchPolymarketUserActivity } from "@/lib/portfolio/fetch-polymarket-activity";
import { mapActivityBatchWithLossInsertions } from "@/lib/portfolio/map-polymarket-activity";
import {
  collectUniqueConditionIds,
  collectUniqueConditionIdsFromPositions,
  type OpenOrderMarketContext
} from "@/lib/portfolio/teams-condition";
import type {
  PortfolioLoadStatus,
  PortfolioTransactionRecord,
  UserOpenOrder
} from "@/lib/portfolio/types";
import { fetchJson } from "@/lib/team/client-fetch";
import { useTeamsConditionStore } from "@/store/teams-condition-store";
import type { UserPositionRecord } from "@/types/market";

export type PortfolioLoadOptions = {
  force?: boolean;
  silent?: boolean;
  page?: number;
};

export interface UsePortfolioDataResult {
  session: ReturnType<typeof useAuth>["session"];
  isAuthenticated: boolean;
  positions: UserPositionRecord[];
  comboPositions: PortfolioComboPositionCard[];
  totalPositionValue: number | undefined;
  openOrders: UserOpenOrder[];
  marketContextMap: Record<string, OpenOrderMarketContext>;
  transactions: PortfolioTransactionRecord[];
  historyHasMore: boolean;
  historyLoadingMore: boolean;
  coreStatus: PortfolioLoadStatus;
  openOrdersStatus: PortfolioLoadStatus;
  historyStatus: PortfolioLoadStatus;
  message: string | undefined;
  reload: () => Promise<void>;
  loadCore: (options?: PortfolioLoadOptions) => Promise<void>;
  loadOpenOrders: (options?: PortfolioLoadOptions) => Promise<void>;
  loadActivityHistory: (options?: PortfolioLoadOptions) => Promise<void>;
  loadMoreActivityHistory: () => Promise<void>;
  removeOpenOrder: (orderId: string) => void;
  removeOpenOrders: (orderIds: string[]) => void;
  removeOpenOrdersByMarket: (marketId: string) => void;
  removeComboPosition: (comboId: string) => void;
  connectWallet: () => Promise<void>;
}

export function usePortfolioData(): UsePortfolioDataResult {
  const { session, isAuthenticated, openLoginModalOnly, refreshCash } =
    useAuth();
  const [positions, setPositions] = useState<UserPositionRecord[]>([]);
  const [comboPositions, setComboPositions] = useState<
    PortfolioComboPositionCard[]
  >([]);
  const [totalPositionValue, setTotalPositionValue] = useState<
    number | undefined
  >();
  const [openOrders, setOpenOrders] = useState<UserOpenOrder[]>([]);
  const [marketContextMap, setMarketContextMap] = useState<
    Record<string, OpenOrderMarketContext>
  >({});
  const [transactions, setTransactions] = useState<
    PortfolioTransactionRecord[]
  >([]);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false);
  const [coreStatus, setCoreStatus] = useState<PortfolioLoadStatus>("idle");
  const [openOrdersStatus, setOpenOrdersStatus] =
    useState<PortfolioLoadStatus>("idle");
  const [historyStatus, setHistoryStatus] =
    useState<PortfolioLoadStatus>("idle");
  const [message, setMessage] = useState<string | undefined>();
  const coreLoadedRef = useRef(false);
  const coreLoadInFlightRef = useRef<Promise<void> | null>(null);
  const sessionUserIdRef = useRef<string | undefined>(undefined);
  const openOrdersLoadedRef = useRef(false);
  const historyLoadedRef = useRef(false);
  const activitiesCacheRef = useRef<PolymarketActivityRow[]>([]);
  const lossPositionsCacheRef = useRef<UserPositionRecord[]>([]);
  const insertedLossIdsRef = useRef<Set<string>>(new Set());
  const historyRequestIdRef = useRef(0);
  const loadMoreRequestIdRef = useRef(0);

  const fetchLossPositions = useCallback(async () => {
    try {
      const positionsPayload = await fetchJson<{
        positions?: UserPositionRecord[];
      }>("/api/trading/positions?limit=100&redeemable=true&sizeThreshold=0.1");
      lossPositionsCacheRef.current = (
        positionsPayload?.positions ?? []
      ).filter((position) => position.currentValue === 0);
    } catch (positionsError) {
      console.warn(
        "[portfolio] redeemable positions failed for loss history",
        positionsError
      );
      lossPositionsCacheRef.current = [];
    }
  }, []);

  const ensureMarketContext = useCallback(
    async (conditionIds: string[], options?: { force?: boolean }) => {
      if (conditionIds.length === 0) {
        return;
      }

      try {
        const map = await useTeamsConditionStore
          .getState()
          .ensureTeamsCondition(conditionIds, options);
        setMarketContextMap((prev) => ({ ...prev, ...map }));
      } catch (error) {
        console.warn("[portfolio] teams-condition failed", error);
      }
    },
    []
  );

  const resetTabData = useCallback(() => {
    setComboPositions([]);
    setOpenOrders([]);
    setTotalPositionValue(undefined);
    setMarketContextMap({});
    setTransactions([]);
    setHistoryHasMore(false);
    setHistoryLoadingMore(false);
    setOpenOrdersStatus("idle");
    setHistoryStatus("idle");
    coreLoadedRef.current = false;
    openOrdersLoadedRef.current = false;
    historyLoadedRef.current = false;
    activitiesCacheRef.current = [];
    lossPositionsCacheRef.current = [];
    insertedLossIdsRef.current = new Set();
    loadMoreRequestIdRef.current = 0;
  }, []);

  const loadCore = useCallback(
    async (options?: PortfolioLoadOptions) => {
      if (!session) {
        setPositions([]);
        setComboPositions([]);
        setTotalPositionValue(undefined);
        resetTabData();
        coreLoadedRef.current = false;
        setCoreStatus("ready");
        setMessage(undefined);
        return;
      }

      if (coreLoadedRef.current && !options?.force) {
        return;
      }

      if (!options?.force && coreLoadInFlightRef.current) {
        return coreLoadInFlightRef.current;
      }

      if (!options?.silent) {
        setCoreStatus("loading");
      }
      setMessage(undefined);

      const loadPromise = (async () => {
        try {
          const errors: string[] = [];
          const polymarketAddress =
            session.funderAddress ?? session.walletAddress;

          const [positionsPayload, comboPositionRecords] = await Promise.all([
            fetchJson<{
              positions?: UserPositionRecord[];
              totalPositionValue?: number;
              error?: string;
            }>("/api/trading/positions?limit=100").catch((error) => {
              errors.push(
                error instanceof Error ? error.message : String(error)
              );
              return undefined;
            }),
            polymarketAddress?.trim()
              ? fetchPolymarketComboPositions(polymarketAddress.trim(), {
                  limit: 20
                }).catch((error) => {
                  console.warn("[portfolio] combo positions failed", error);
                  return [];
                })
              : Promise.resolve([])
          ]);

          const nextPositions = (positionsPayload?.positions ?? []).filter(
            (position) => position.currentValue !== 0
          );
          setPositions(nextPositions);
          setComboPositions(mapComboPositionsToCards(comboPositionRecords));
          setTotalPositionValue(positionsPayload?.totalPositionValue);

          const conditionIds =
            collectUniqueConditionIdsFromPositions(nextPositions);
          await ensureMarketContext(conditionIds, { force: options?.force });

          const apiErrors = [positionsPayload?.error].filter(Boolean);
          const combinedMessage =
            [...errors, ...apiErrors].join(" ").trim() || undefined;
          setMessage(combinedMessage);
          coreLoadedRef.current = true;
          setCoreStatus(
            combinedMessage && !positionsPayload ? "error" : "ready"
          );
        } catch (error) {
          coreLoadedRef.current = true;
          setCoreStatus("error");
          setMessage(error instanceof Error ? error.message : String(error));
        } finally {
          if (!options?.force) {
            coreLoadInFlightRef.current = null;
          }
        }
      })();

      if (!options?.force) {
        coreLoadInFlightRef.current = loadPromise;
      }

      return loadPromise;
    },
    [ensureMarketContext, resetTabData, session]
  );

  const loadOpenOrders = useCallback(
    async (options?: PortfolioLoadOptions) => {
      if (!session) {
        return;
      }

      if (openOrdersLoadedRef.current && !options?.force) {
        return;
      }

      if (!options?.silent && !openOrdersLoadedRef.current) {
        setOpenOrdersStatus("loading");
      }

      try {
        const payload = await fetchJson<{
          orders?: UserOpenOrder[];
          error?: string;
        }>("/api/trading/orders/open");

        const orders = payload?.orders ?? [];
        setOpenOrders(orders);

        const conditionIds = collectUniqueConditionIds(orders);
        await ensureMarketContext(conditionIds, { force: options?.force });

        openOrdersLoadedRef.current = true;
        setOpenOrdersStatus(payload?.error ? "error" : "ready");
      } catch {
        openOrdersLoadedRef.current = true;
        setOpenOrders([]);
        setOpenOrdersStatus("error");
      }
    },
    [ensureMarketContext, session]
  );

  const loadActivityHistory = useCallback(
    async (options?: PortfolioLoadOptions) => {
      if (!session) {
        return;
      }

      if (historyLoadedRef.current && !options?.force) {
        return;
      }

      const polymarketAddress = session.funderAddress ?? session.walletAddress;

      if (!polymarketAddress?.trim()) {
        setTransactions([]);
        setHistoryHasMore(false);
        historyLoadedRef.current = true;
        setHistoryStatus("ready");
        return;
      }

      const requestId = historyRequestIdRef.current + 1;
      historyRequestIdRef.current = requestId;

      if (!historyLoadedRef.current || options?.force) {
        setHistoryStatus("loading");
      }

      try {
        activitiesCacheRef.current = [];
        lossPositionsCacheRef.current = [];
        insertedLossIdsRef.current = new Set();

        const [activityResult] = await Promise.all([
          fetchPolymarketUserActivity(polymarketAddress, {
            limit: PORTFOLIO_HISTORY_PAGE_SIZE,
            offset: 0
          }),
          fetchLossPositions()
        ]);

        if (historyRequestIdRef.current !== requestId) {
          return;
        }

        activitiesCacheRef.current = activityResult.activities;
        setTransactions(
          mapActivityBatchWithLossInsertions(
            activityResult.activities,
            lossPositionsCacheRef.current,
            insertedLossIdsRef.current
          )
        );
        setHistoryHasMore(activityResult.hasMore);
        historyLoadedRef.current = true;
        setHistoryStatus("ready");
      } catch {
        if (historyRequestIdRef.current !== requestId) {
          return;
        }

        historyLoadedRef.current = true;
        setTransactions([]);
        setHistoryHasMore(false);
        setHistoryStatus("error");
      }
    },
    [fetchLossPositions, session]
  );

  const loadMoreActivityHistory = useCallback(async () => {
    if (!session || !historyHasMore || historyLoadingMore) {
      return;
    }

    const polymarketAddress = session.funderAddress ?? session.walletAddress;

    if (!polymarketAddress?.trim()) {
      return;
    }

    const requestId = loadMoreRequestIdRef.current + 1;
    loadMoreRequestIdRef.current = requestId;
    setHistoryLoadingMore(true);

    try {
      const offset = activitiesCacheRef.current.length;
      const { activities, hasMore } = await fetchPolymarketUserActivity(
        polymarketAddress,
        {
          limit: PORTFOLIO_HISTORY_PAGE_SIZE,
          offset
        }
      );

      if (loadMoreRequestIdRef.current !== requestId) {
        return;
      }

      activitiesCacheRef.current = [
        ...activitiesCacheRef.current,
        ...activities
      ];

      const incoming = mapActivityBatchWithLossInsertions(
        activities,
        lossPositionsCacheRef.current,
        insertedLossIdsRef.current
      );

      setTransactions((previous) => {
        const existingIds = new Set(previous.map((item) => item.id));
        const appended = incoming.filter((item) => !existingIds.has(item.id));

        if (appended.length === 0) {
          return previous;
        }

        return [...previous, ...appended];
      });
      setHistoryHasMore(hasMore);
    } catch {
      if (loadMoreRequestIdRef.current !== requestId) {
        return;
      }
    } finally {
      if (loadMoreRequestIdRef.current === requestId) {
        setHistoryLoadingMore(false);
      }
    }
  }, [historyHasMore, historyLoadingMore, session]);

  const reload = useCallback(async () => {
    if (!session) {
      return;
    }

    await Promise.all([loadCore({ force: true }), refreshCash()]);

    if (openOrdersLoadedRef.current) {
      await loadOpenOrders({ force: true });
    }

    if (historyLoadedRef.current) {
      await loadActivityHistory({ force: true });
    }
  }, [loadActivityHistory, loadCore, loadOpenOrders, refreshCash, session]);

  useEffect(() => {
    if (!session) {
      if (sessionUserIdRef.current !== undefined) {
        resetTabData();
      }
      sessionUserIdRef.current = undefined;
      coreLoadInFlightRef.current = null;
      setPositions([]);
      setComboPositions([]);
      setTotalPositionValue(undefined);
      coreLoadedRef.current = false;
      setCoreStatus("ready");
      setMessage(undefined);
      return;
    }

    if (sessionUserIdRef.current !== session.userId) {
      resetTabData();
      coreLoadedRef.current = false;
      coreLoadInFlightRef.current = null;
    }
    sessionUserIdRef.current = session.userId;

    void loadCore();
  }, [loadCore, resetTabData, session]);

  const removeOpenOrders = useCallback((orderIds: string[]) => {
    if (orderIds.length === 0) {
      return;
    }

    const idSet = new Set(orderIds);
    setOpenOrders((current) => current.filter((order) => !idSet.has(order.id)));
  }, []);

  const removeOpenOrder = useCallback(
    (orderId: string) => {
      removeOpenOrders([orderId]);
    },
    [removeOpenOrders]
  );

  const removeOpenOrdersByMarket = useCallback((marketId: string) => {
    setOpenOrders((current) =>
      current.filter((order) => order.market !== marketId)
    );
  }, []);

  const removeComboPosition = useCallback((comboId: string) => {
    setComboPositions((current) =>
      current.filter((combo) => combo.id !== comboId)
    );
  }, []);

  const connectWallet = useCallback(async () => {
    setCoreStatus("loading");
    setMessage(undefined);

    try {
      await openLoginModalOnly();
      await loadCore();
    } catch (error) {
      setCoreStatus("error");
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }, [loadCore, openLoginModalOnly]);

  return {
    session,
    isAuthenticated,
    positions,
    comboPositions,
    totalPositionValue,
    openOrders,
    marketContextMap,
    transactions,
    historyHasMore,
    historyLoadingMore,
    coreStatus,
    openOrdersStatus,
    historyStatus,
    message,
    reload,
    loadCore,
    loadOpenOrders,
    loadActivityHistory,
    loadMoreActivityHistory,
    removeOpenOrder,
    removeOpenOrders,
    removeOpenOrdersByMarket,
    removeComboPosition,
    connectWallet
  };
}
