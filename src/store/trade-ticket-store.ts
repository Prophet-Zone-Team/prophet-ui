"use client";

import { create } from "zustand";

import {
  formatDefaultGameTradeLimitPrice,
  formatDefaultTradeLimitPrice
} from "@/lib/market/trade-ticket";
import type {
  GameMarketSnapshot,
  MatchOutcomeSide,
  OrderOutcomeSide,
  TeamMarketSnapshot,
  TradeEntityType
} from "@/types/market";
import type { TradeOrderMode } from "@/views/trade/trade-widget/trade-market-button";

export type TradeTabId = "buy" | "sell";

interface TradeTicketState {
  marketKey: string | null;
  entityType: TradeEntityType;
  matchOutcomeSide: MatchOutcomeSide;
  outcomeSide: OrderOutcomeSide;
  tab: TradeTabId;
  orderMode: TradeOrderMode;
  amount: string;
  limitPrice: string;
  syncForTeamSnapshot: (snapshot: TeamMarketSnapshot) => void;
  syncForGameSnapshot: (snapshot: GameMarketSnapshot) => void;
  setOutcomeSide: (side: OrderOutcomeSide) => void;
  setMatchOutcomeSide: (side: MatchOutcomeSide) => void;
  setTab: (tab: TradeTabId) => void;
  setOrderMode: (mode: TradeOrderMode) => void;
  setAmount: (amount: string) => void;
  setLimitPrice: (limitPrice: string) => void;
}

const defaultTicketState = {
  marketKey: null as string | null,
  entityType: "team" as TradeEntityType,
  matchOutcomeSide: "home" as MatchOutcomeSide,
  outcomeSide: "yes" as OrderOutcomeSide,
  tab: "buy" as TradeTabId,
  orderMode: "market" as TradeOrderMode,
  amount: "1",
  limitPrice: "0.010"
};

export const useTradeTicketStore = create<TradeTicketState>()((set, get) => ({
  ...defaultTicketState,
  syncForTeamSnapshot: (snapshot) => {
    const marketKey = snapshot.team.id;

    if (get().marketKey === marketKey && get().entityType === "team") {
      return;
    }

    set({
      marketKey,
      entityType: "team",
      matchOutcomeSide: "home",
      outcomeSide: "yes",
      tab: "buy",
      orderMode: "market",
      amount: "1",
      limitPrice: formatDefaultTradeLimitPrice(snapshot, "yes")
    });
  },
  syncForGameSnapshot: (snapshot) => {
    const marketKey = snapshot.match.id;

    if (get().marketKey === marketKey && get().entityType === "game") {
      return;
    }

    set({
      marketKey,
      entityType: "game",
      matchOutcomeSide: "home",
      outcomeSide: "yes",
      tab: "buy",
      orderMode: "market",
      amount: "1",
      limitPrice: formatDefaultGameTradeLimitPrice(snapshot, "home", "yes")
    });
  },
  setOutcomeSide: (side) => set({ outcomeSide: side }),
  setMatchOutcomeSide: (side) => set({ matchOutcomeSide: side, outcomeSide: "yes" }),
  setTab: (tab) => set({ tab }),
  setOrderMode: (orderMode) => set({ orderMode }),
  setAmount: (amount) => set({ amount }),
  setLimitPrice: (limitPrice) => set({ limitPrice })
}));

export function useTradeEntityType() {
  return useTradeTicketStore((state) => state.entityType);
}

export function useTradeMatchOutcomeSide() {
  return useTradeTicketStore((state) => state.matchOutcomeSide);
}

export function useSetTradeMatchOutcomeSide() {
  return useTradeTicketStore((state) => state.setMatchOutcomeSide);
}

export function useTradeOutcomeSide() {
  return useTradeTicketStore((state) => state.outcomeSide);
}

export function useSetTradeOutcomeSide() {
  return useTradeTicketStore((state) => state.setOutcomeSide);
}

export function useTradeTab() {
  return useTradeTicketStore((state) => state.tab);
}

export function useSetTradeTab() {
  return useTradeTicketStore((state) => state.setTab);
}

export function useTradeOrderMode() {
  return useTradeTicketStore((state) => state.orderMode);
}

export function useSetTradeOrderMode() {
  return useTradeTicketStore((state) => state.setOrderMode);
}

export function useTradeAmount() {
  return useTradeTicketStore((state) => state.amount);
}

export function useSetTradeAmount() {
  return useTradeTicketStore((state) => state.setAmount);
}

export function useTradeLimitPrice() {
  return useTradeTicketStore((state) => state.limitPrice);
}

export function useSetTradeLimitPrice() {
  return useTradeTicketStore((state) => state.setLimitPrice);
}

export function useSyncTradeTeamSnapshot() {
  return useTradeTicketStore((state) => state.syncForTeamSnapshot);
}

export function useSyncTradeGameSnapshot() {
  return useTradeTicketStore((state) => state.syncForGameSnapshot);
}

/** @deprecated Use useSyncTradeTeamSnapshot instead. */
export function useSyncTradeTicketSnapshot() {
  return useTradeTicketStore((state) => state.syncForTeamSnapshot);
}
