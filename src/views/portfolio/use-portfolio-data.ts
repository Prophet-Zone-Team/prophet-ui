"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchJson } from "@/lib/team/client-fetch";
import type { PortfolioLoadStatus } from "@/lib/portfolio/types";
import type { UserOpenOrder } from "@/lib/portfolio/types";
import type {
  TradingUserSession,
  UserOrderRecord,
  UserPositionRecord,
  UserTradingReadiness
} from "@/types/market";
import {
  connectTradingWallet,
  loadTradingSession
} from "@/components/trading/trading-wallet-session";

export interface UsePortfolioDataResult {
  session: TradingUserSession | undefined;
  readiness: UserTradingReadiness | undefined;
  positions: UserPositionRecord[];
  openOrders: UserOpenOrder[];
  orderHistory: UserOrderRecord[];
  status: PortfolioLoadStatus;
  message: string | undefined;
  reload: () => Promise<void>;
  connectWallet: () => Promise<void>;
}

export function usePortfolioData(): UsePortfolioDataResult {
  const [session, setSession] = useState<TradingUserSession | undefined>();
  const [readiness, setReadiness] = useState<UserTradingReadiness | undefined>();
  const [positions, setPositions] = useState<UserPositionRecord[]>([]);
  const [openOrders, setOpenOrders] = useState<UserOpenOrder[]>([]);
  const [orderHistory, setOrderHistory] = useState<UserOrderRecord[]>([]);
  const [status, setStatus] = useState<PortfolioLoadStatus>("idle");
  const [message, setMessage] = useState<string | undefined>();

  const loadPortfolio = useCallback(async () => {
    setStatus("loading");
    setMessage(undefined);

    try {
      const tradingSession = await loadTradingSession();
      setSession(tradingSession);

      if (!tradingSession) {
        setPositions([]);
        setOpenOrders([]);
        setOrderHistory([]);
        setReadiness(undefined);
        setStatus("ready");
        return;
      }

      const errors: string[] = [];

      const [positionsPayload, openOrdersPayload, historyPayload, readinessPayload] =
        await Promise.all([
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
          fetchJson<UserTradingReadiness>("/api/trading/readiness").catch((error) => {
            errors.push(error instanceof Error ? error.message : String(error));
            return undefined;
          })
        ]);

      setPositions(positionsPayload?.positions ?? []);
      setOpenOrders(openOrdersPayload?.orders ?? []);
      setOrderHistory(historyPayload?.orders ?? openOrdersPayload?.history ?? []);
      setReadiness(readinessPayload);

      const apiErrors = [
        positionsPayload?.error,
        openOrdersPayload?.error,
        historyPayload?.error
      ].filter(Boolean);

      const combinedMessage = [...errors, ...apiErrors].join(" ").trim() || undefined;
      setMessage(combinedMessage);
      setStatus(combinedMessage && !positionsPayload ? "error" : "ready");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }, []);

  useEffect(() => {
    void loadPortfolio();
  }, [loadPortfolio]);

  const connectWallet = useCallback(async () => {
    setStatus("loading");
    setMessage(undefined);

    try {
      setSession(await connectTradingWallet());
      await loadPortfolio();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }, [loadPortfolio]);

  // FIXME
  useEffect(() => {
    if (!session) {
      return;
    }
    console.log(session)
    const url = new URL("https://gamma-api.polymarket.com/public-profile");
    url.searchParams.set("address", session.walletAddress);
    fetch(url.toString()).then((res) => {
      console.log(res)
    }).catch((error) => {
      console.log(error)
    })
  }, [session]);

  return {
    session,
    readiness,
    positions,
    openOrders,
    orderHistory,
    status,
    message,
    reload: loadPortfolio,
    connectWallet
  };
}
