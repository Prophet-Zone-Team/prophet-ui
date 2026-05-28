"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/context/auth";
import { fetchJson } from "@/lib/team/client-fetch";
import type {
  PortfolioLoadStatus,
  UserActivityRecord,
  UserOpenOrder
} from "@/lib/portfolio/types";
import { mergeTradingReadiness } from "@/lib/trading/merge-trading-readiness";
import type {
  UserPositionRecord,
  UserTradingBalancesResponse,
  UserTradingReadiness,
} from "@/types/market";

export interface UsePortfolioDataResult {
  session: ReturnType<typeof useAuth>["session"];
  readiness: UserTradingReadiness | undefined;
  isAuthenticated: boolean;
  positions: UserPositionRecord[];
  openOrders: UserOpenOrder[];
  activityHistory: UserActivityRecord[];
  coreStatus: PortfolioLoadStatus;
  openOrdersStatus: PortfolioLoadStatus;
  historyStatus: PortfolioLoadStatus;
  message: string | undefined;
  reload: () => Promise<void>;
  loadOpenOrders: () => Promise<void>;
  loadActivityHistory: () => Promise<void>;
  removeOpenOrder: (orderId: string) => void;
  connectWallet: () => Promise<void>;
}

export function usePortfolioData(): UsePortfolioDataResult {
  const { session, isAuthenticated, openLogin } = useAuth();
  const [readiness, setReadiness] = useState<
    UserTradingReadiness | undefined
  >();
  const [positions, setPositions] = useState<UserPositionRecord[]>([]);
  const [openOrders, setOpenOrders] = useState<UserOpenOrder[]>([]);
  const [activityHistory, setActivityHistory] = useState<UserActivityRecord[]>(
    []
  );
  const [coreStatus, setCoreStatus] = useState<PortfolioLoadStatus>("idle");
  const [openOrdersStatus, setOpenOrdersStatus] =
    useState<PortfolioLoadStatus>("idle");
  const [historyStatus, setHistoryStatus] =
    useState<PortfolioLoadStatus>("idle");
  const [message, setMessage] = useState<string | undefined>();
  const openOrdersLoadedRef = useRef(false);
  const historyLoadedRef = useRef(false);

  const resetTabData = useCallback(() => {
    setOpenOrders([]);
    setActivityHistory([]);
    setOpenOrdersStatus("idle");
    setHistoryStatus("idle");
    openOrdersLoadedRef.current = false;
    historyLoadedRef.current = false;
  }, []);

  const loadCore = useCallback(async () => {
    setCoreStatus("loading");
    setMessage(undefined);

    try {
      if (!session) {
        setPositions([]);
        setReadiness(undefined);
        resetTabData();
        setCoreStatus("ready");
        return;
      }

      const errors: string[] = [];

      const [positionsPayload, setupPayload, balancesPayload] = await Promise.all([
        fetchJson<{ positions?: UserPositionRecord[]; error?: string }>(
          "/api/trading/positions?limit=100"
        ).catch((error) => {
          errors.push(error instanceof Error ? error.message : String(error));
          return undefined;
        }),
        fetchJson<UserTradingReadiness>("/api/trading/readiness").catch((error) => {
          errors.push(error instanceof Error ? error.message : String(error));
          return undefined;
        }),
        fetchJson<UserTradingBalancesResponse>("/api/trading/balances").catch(
          (error) => {
            errors.push(error instanceof Error ? error.message : String(error));
            return undefined;
          }
        ),
      ]);

      setPositions(positionsPayload?.positions ?? []);
      setReadiness(
        setupPayload
          ? mergeTradingReadiness(setupPayload, balancesPayload)
          : undefined
      );

      const apiErrors = [positionsPayload?.error].filter(Boolean);
      const combinedMessage =
        [...errors, ...apiErrors].join(" ").trim() || undefined;
      setMessage(combinedMessage);
      setCoreStatus(combinedMessage && !positionsPayload ? "error" : "ready");
    } catch (error) {
      setCoreStatus("error");
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }, [resetTabData, session]);

  const loadOpenOrders = useCallback(
    async (options?: { force?: boolean }) => {
      if (!session) {
        return;
      }

      if (openOrdersLoadedRef.current && !options?.force) {
        return;
      }

      setOpenOrdersStatus("loading");

      try {
        const payload = await fetchJson<{
          orders?: UserOpenOrder[];
          error?: string;
        }>("/api/trading/orders/open");

        setOpenOrders(payload?.orders ?? []);
        openOrdersLoadedRef.current = true;
        setOpenOrdersStatus(payload?.error ? "error" : "ready");
      } catch {
        openOrdersLoadedRef.current = true;
        setOpenOrders([]);
        setOpenOrdersStatus("error");
      }
    },
    [session]
  );

  const loadActivityHistory = useCallback(
    async (options?: { force?: boolean }) => {
      if (!session) {
        return;
      }

      if (historyLoadedRef.current && !options?.force) {
        return;
      }

      setHistoryStatus("loading");

      try {
        const payload = await fetchJson<{
          activities?: UserActivityRecord[];
          error?: string;
        }>("/api/trading/orders/history?limit=40");

        setActivityHistory(payload?.activities ?? []);
        historyLoadedRef.current = true;
        setHistoryStatus(payload?.error ? "error" : "ready");
      } catch {
        historyLoadedRef.current = true;
        setActivityHistory([]);
        setHistoryStatus("error");
      }
    },
    [session]
  );

  const reload = useCallback(async () => {
    await loadCore();

    if (openOrdersLoadedRef.current) {
      await loadOpenOrders({ force: true });
    }

    if (historyLoadedRef.current) {
      await loadActivityHistory({ force: true });
    }
  }, [loadActivityHistory, loadCore, loadOpenOrders]);

  useEffect(() => {
    resetTabData();
    void loadCore();
  }, [loadCore, resetTabData]);

  const removeOpenOrder = useCallback((orderId: string) => {
    setOpenOrders((current) => current.filter((order) => order.id !== orderId));
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
    readiness,
    isAuthenticated,
    positions,
    openOrders,
    activityHistory,
    coreStatus,
    openOrdersStatus,
    historyStatus,
    message,
    reload,
    loadOpenOrders,
    loadActivityHistory,
    removeOpenOrder,
    connectWallet
  };
}
