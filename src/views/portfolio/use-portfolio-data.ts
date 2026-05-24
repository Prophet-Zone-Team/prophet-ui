"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/context/auth";
import { fetchJson } from "@/lib/team/client-fetch";
import type {
  PortfolioLoadStatus,
  UserActivityRecord,
  UserOpenOrder
} from "@/lib/portfolio/types";
import type { UserPositionRecord, UserTradingReadiness } from "@/types/market";

export interface UsePortfolioDataResult {
  session: ReturnType<typeof useAuth>["session"];
  readiness: UserTradingReadiness | undefined;
  isAuthenticated: boolean;
  positions: UserPositionRecord[];
  openOrders: UserOpenOrder[];
  activityHistory: UserActivityRecord[];
  status: PortfolioLoadStatus;
  message: string | undefined;
  reload: () => Promise<void>;
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
  const [status, setStatus] = useState<PortfolioLoadStatus>("idle");
  const [message, setMessage] = useState<string | undefined>();

  const loadPortfolio = useCallback(async () => {
    setStatus("loading");
    setMessage(undefined);

    try {
      if (!session) {
        setPositions([]);
        setOpenOrders([]);
        setActivityHistory([]);
        setReadiness(undefined);
        setStatus("ready");
        return;
      }

      const errors: string[] = [];

      const [
        positionsPayload,
        openOrdersPayload,
        historyPayload,
        readinessPayload
      ] = await Promise.all([
        fetchJson<{ positions?: UserPositionRecord[]; error?: string }>(
          "/api/trading/positions?limit=100"
        ).catch((error) => {
          errors.push(error instanceof Error ? error.message : String(error));
          return undefined;
        }),
        fetchJson<{ orders?: UserOpenOrder[]; error?: string }>(
          "/api/trading/orders/open"
        ).catch((error) => {
          errors.push(error instanceof Error ? error.message : String(error));
          return undefined;
        }),
        fetchJson<{ activities?: UserActivityRecord[]; error?: string }>(
          "/api/trading/orders/history?limit=40"
        ).catch((error) => {
          errors.push(error instanceof Error ? error.message : String(error));
          return undefined;
        }),
        fetchJson<UserTradingReadiness>("/api/trading/readiness").catch(
          (error) => {
            errors.push(error instanceof Error ? error.message : String(error));
            return undefined;
          }
        )
      ]);

      setPositions(positionsPayload?.positions ?? []);
      setOpenOrders(openOrdersPayload?.orders ?? []);
      setActivityHistory(historyPayload?.activities ?? []);
      setReadiness(readinessPayload);

      const apiErrors = [
        positionsPayload?.error,
        openOrdersPayload?.error,
        historyPayload?.error
      ].filter(Boolean);

      const combinedMessage =
        [...errors, ...apiErrors].join(" ").trim() || undefined;
      setMessage(combinedMessage);
      setStatus(combinedMessage && !positionsPayload ? "error" : "ready");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }, [session]);

  useEffect(() => {
    void loadPortfolio();
  }, [loadPortfolio]);

  const removeOpenOrder = useCallback((orderId: string) => {
    setOpenOrders((current) => current.filter((order) => order.id !== orderId));
  }, []);

  const connectWallet = useCallback(async () => {
    setStatus("loading");
    setMessage(undefined);

    try {
      await openLogin();
      await loadPortfolio();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }, [loadPortfolio, openLogin]);

  return {
    session,
    readiness,
    isAuthenticated,
    positions,
    openOrders,
    activityHistory,
    status,
    message,
    reload: loadPortfolio,
    removeOpenOrder,
    connectWallet
  };
}
