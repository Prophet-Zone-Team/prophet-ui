"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/context/auth";
import { fetchJson } from "@/lib/team/client-fetch";
import type { PortfolioLoadStatus } from "@/lib/portfolio/types";
import type { UserOpenOrder } from "@/lib/portfolio/types";
import type {
  UserOrderRecord,
  UserPositionRecord,
  UserTradingReadiness
} from "@/types/market";

export interface UsePortfolioDataResult {
  session: ReturnType<typeof useAuth>["session"];
  readiness: UserTradingReadiness | undefined;
  isAuthenticated: boolean;
  positions: UserPositionRecord[];
  openOrders: UserOpenOrder[];
  orderHistory: UserOrderRecord[];
  status: PortfolioLoadStatus;
  message: string | undefined;
  reload: () => Promise<void>;
  connectWallet: () => Promise<void>;
}

export function usePortfolioData(): UsePortfolioDataResult {
  const { session, isAuthenticated, openLogin } = useAuth();
  const [readiness, setReadiness] = useState<
    UserTradingReadiness | undefined
  >();
  const [positions, setPositions] = useState<UserPositionRecord[]>([]);
  const [openOrders, setOpenOrders] = useState<UserOpenOrder[]>([]);
  const [orderHistory, setOrderHistory] = useState<UserOrderRecord[]>([]);
  const [status, setStatus] = useState<PortfolioLoadStatus>("idle");
  const [message, setMessage] = useState<string | undefined>();

  const loadPortfolio = useCallback(async () => {
    setStatus("loading");
    setMessage(undefined);

    try {
      if (!session) {
        setPositions([]);
        setOpenOrders([]);
        setOrderHistory([]);
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
        fetchJson<{
          orders?: UserOpenOrder[];
          history?: UserOrderRecord[];
          error?: string;
        }>("/api/trading/orders/open").catch((error) => {
          errors.push(error instanceof Error ? error.message : String(error));
          return undefined;
        }),
        fetchJson<{ orders?: UserOrderRecord[]; error?: string }>(
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
      setOrderHistory(
        historyPayload?.orders ?? openOrdersPayload?.history ?? []
      );
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
    orderHistory,
    status,
    message,
    reload: loadPortfolio,
    connectWallet
  };
}
