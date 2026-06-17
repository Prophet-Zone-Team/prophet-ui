"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/context/auth";
import { PORTFOLIO_HISTORY_PAGE_SIZE } from "@/lib/portfolio/config";
import {
  applyTradeLossFromPositions,
  mapProphetUserTransactions
} from "@/lib/portfolio/map-user-transaction";
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
import {
  getProphetUserTransactions,
  isProphetAuthenticated
} from "@/service/prophet";
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
  openOrders: UserOpenOrder[];
  marketContextMap: Record<string, OpenOrderMarketContext>;
  transactions: PortfolioTransactionRecord[];
  historyPage: number;
  historyTotal: number;
  historyPageSize: number;
  coreStatus: PortfolioLoadStatus;
  openOrdersStatus: PortfolioLoadStatus;
  historyStatus: PortfolioLoadStatus;
  message: string | undefined;
  reload: () => Promise<void>;
  loadCore: (options?: PortfolioLoadOptions) => Promise<void>;
  loadOpenOrders: (options?: PortfolioLoadOptions) => Promise<void>;
  loadActivityHistory: (options?: PortfolioLoadOptions) => Promise<void>;
  setHistoryPage: (page: number) => void;
  removeOpenOrder: (orderId: string) => void;
  removeOpenOrders: (orderIds: string[]) => void;
  removeOpenOrdersByMarket: (marketId: string) => void;
  connectWallet: () => Promise<void>;
}

export function usePortfolioData(): UsePortfolioDataResult {
  const { session, isAuthenticated, openLogin, refreshCash } = useAuth();
  const [positions, setPositions] = useState<UserPositionRecord[]>([]);
  const [openOrders, setOpenOrders] = useState<UserOpenOrder[]>([]);
  const [marketContextMap, setMarketContextMap] = useState<
    Record<string, OpenOrderMarketContext>
  >({});
  const [transactions, setTransactions] = useState<PortfolioTransactionRecord[]>(
    []
  );
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
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
  const historyLoadedPagesRef = useRef<Set<number>>(new Set());
  const historyRequestIdRef = useRef(0);

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
    setOpenOrders([]);
    setMarketContextMap({});
    setTransactions([]);
    setHistoryPage(1);
    setHistoryTotal(0);
    setOpenOrdersStatus("idle");
    setHistoryStatus("idle");
    coreLoadedRef.current = false;
    openOrdersLoadedRef.current = false;
    historyLoadedPagesRef.current = new Set();
  }, []);

  const loadCore = useCallback(async (options?: PortfolioLoadOptions) => {
    if (!session) {
      setPositions([]);
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

        const positionsPayload = await fetchJson<{
          positions?: UserPositionRecord[];
          error?: string;
        }>("/api/trading/positions?limit=100").catch((error) => {
          errors.push(error instanceof Error ? error.message : String(error));
          return undefined;
        });

        const nextPositions = (positionsPayload?.positions ?? []).filter(
          (position) => position.currentValue !== 0
        );
        setPositions(nextPositions);

        const conditionIds =
          collectUniqueConditionIdsFromPositions(nextPositions);
        await ensureMarketContext(conditionIds, { force: options?.force });

        const apiErrors = [positionsPayload?.error].filter(Boolean);
        const combinedMessage =
          [...errors, ...apiErrors].join(" ").trim() || undefined;
        setMessage(combinedMessage);
        coreLoadedRef.current = true;
        setCoreStatus(combinedMessage && !positionsPayload ? "error" : "ready");
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
  }, [ensureMarketContext, resetTabData, session]);

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

      const page = options?.page ?? historyPage;
      const alreadyLoaded = historyLoadedPagesRef.current.has(page);

      if (alreadyLoaded && !options?.force) {
        return;
      }

      if (!isProphetAuthenticated()) {
        setTransactions([]);
        setHistoryTotal(0);
        historyLoadedPagesRef.current.add(page);
        setHistoryStatus("ready");
        return;
      }

      const requestId = historyRequestIdRef.current + 1;
      historyRequestIdRef.current = requestId;

      if (!alreadyLoaded) {
        setHistoryStatus("loading");
      }

      try {
        const payload = await getProphetUserTransactions({
          page,
          page_size: PORTFOLIO_HISTORY_PAGE_SIZE
        });

        if (historyRequestIdRef.current !== requestId) {
          return;
        }

        const mapped = mapProphetUserTransactions(payload.list);

        let transactionsWithLoss = mapped;

        try {
          const positionsPayload = await fetchJson<{
            positions?: UserPositionRecord[];
          }>(
            "/api/trading/positions?limit=100&redeemable=true&sizeThreshold=0.1"
          );
          transactionsWithLoss = applyTradeLossFromPositions(
            mapped,
            payload.list ?? [],
            positionsPayload?.positions ?? []
          );
        } catch (positionsError) {
          console.warn(
            "[portfolio] redeemable positions failed for loss detection",
            positionsError
          );
        }

        setTransactions(transactionsWithLoss);
        setHistoryTotal(payload.total ?? 0);
        historyLoadedPagesRef.current.add(page);
        setHistoryStatus("ready");
      } catch {
        if (historyRequestIdRef.current !== requestId) {
          return;
        }

        historyLoadedPagesRef.current.add(page);
        setTransactions([]);
        setHistoryStatus("error");
      }
    },
    [historyPage, session]
  );

  const setHistoryPageAndLoad = useCallback(
    (page: number) => {
      setHistoryPage(page);
      void loadActivityHistory({ page, force: true });
    },
    [loadActivityHistory]
  );

  const reload = useCallback(async () => {
    if (!session) {
      return;
    }

    await Promise.all([loadCore({ force: true }), refreshCash()]);

    if (openOrdersLoadedRef.current) {
      await loadOpenOrders({ force: true });
    }

    if (historyLoadedPagesRef.current.size > 0) {
      historyLoadedPagesRef.current.delete(historyPage);
      await loadActivityHistory({ page: historyPage, force: true });
    }
  }, [
    historyPage,
    loadActivityHistory,
    loadCore,
    loadOpenOrders,
    refreshCash,
    session
  ]);

  useEffect(() => {
    if (!session) {
      if (sessionUserIdRef.current !== undefined) {
        resetTabData();
      }
      sessionUserIdRef.current = undefined;
      coreLoadInFlightRef.current = null;
      setPositions([]);
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

  const connectWallet = useCallback(async () => {
    setCoreStatus("loading");
    setMessage(undefined);

    try {
      await openLogin();
      await loadCore();
    } catch (error) {
      setCoreStatus("error");
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }, [loadCore, openLogin]);

  return {
    session,
    isAuthenticated,
    positions,
    openOrders,
    marketContextMap,
    transactions,
    historyPage,
    historyTotal,
    historyPageSize: PORTFOLIO_HISTORY_PAGE_SIZE,
    coreStatus,
    openOrdersStatus,
    historyStatus,
    message,
    reload,
    loadCore,
    loadOpenOrders,
    loadActivityHistory,
    setHistoryPage: setHistoryPageAndLoad,
    removeOpenOrder,
    removeOpenOrders,
    removeOpenOrdersByMarket,
    connectWallet
  };
}
