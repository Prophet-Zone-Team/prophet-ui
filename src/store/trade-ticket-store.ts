"use client";

import { create } from "zustand";

import {
  formatDefaultGameTradeLimitPrice,
  formatDefaultTradeLimitPrice
} from "@/lib/market/trade-ticket";
import { resolveMaxSellShares } from "@/lib/market/order-math";
import { resolveOutcomeSideForPosition } from "@/lib/portfolio/portfolio-metrics";
import type {
  FixtureMarketOutcome,
  GameMarketSnapshot,
  MatchOutcomeSide,
  OrderOutcomeSide,
  TeamMarketSnapshot,
  TradeEntityType,
  UserPositionRecord
} from "@/types/market";
import type { TradeOrderMode } from "@/views/trade/trade-widget/trade-market-button";

export type TradeTabId = "buy" | "sell";

export type LimitExpirationPreset =
  | "never"
  | "5m"
  | "1h"
  | "12h"
  | "24h"
  | "end_of_day"
  | "custom";

interface TradeTicketState {
  marketKey: string | null;
  entityType: TradeEntityType;
  matchOutcomeSide: MatchOutcomeSide;
  selectedFixtureOutcome: FixtureMarketOutcome | null;
  outcomeSide: OrderOutcomeSide;
  tab: TradeTabId;
  orderMode: TradeOrderMode;
  amount: string;
  limitPrice: string;
  limitExpiration: LimitExpirationPreset;
  limitExpirationCustom?: string;
  syncForTeamSnapshot: (snapshot: TeamMarketSnapshot) => void;
  syncForGameSnapshot: (snapshot: GameMarketSnapshot) => void;
  syncForPositionSell: (
    snapshot: TeamMarketSnapshot,
    position: UserPositionRecord
  ) => void;
  setOutcomeSide: (side: OrderOutcomeSide) => void;
  setMatchOutcomeSide: (side: MatchOutcomeSide) => void;
  selectFixtureOutcome: (
    outcome: FixtureMarketOutcome,
    binarySide?: OrderOutcomeSide
  ) => void;
  setTab: (tab: TradeTabId) => void;
  setOrderMode: (mode: TradeOrderMode) => void;
  setAmount: (amount: string) => void;
  setLimitPrice: (limitPrice: string) => void;
  setLimitExpiration: (preset: LimitExpirationPreset) => void;
  setLimitExpirationCustom: (value: string | undefined) => void;
}

const defaultTicketState = {
  marketKey: null as string | null,
  entityType: "team" as TradeEntityType,
  matchOutcomeSide: "home" as MatchOutcomeSide,
  selectedFixtureOutcome: null as FixtureMarketOutcome | null,
  outcomeSide: "yes" as OrderOutcomeSide,
  tab: "buy" as TradeTabId,
  orderMode: "market" as TradeOrderMode,
  amount: "1",
  limitPrice: "0.010",
  limitExpiration: "never" as LimitExpirationPreset,
  limitExpirationCustom: undefined as string | undefined
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
      selectedFixtureOutcome: null,
      outcomeSide: "yes",
      tab: "buy",
      orderMode: "market",
      amount: "1",
      limitPrice: formatDefaultTradeLimitPrice(snapshot, "yes"),
      limitExpiration: "never",
      limitExpirationCustom: undefined
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
      selectedFixtureOutcome: null,
      outcomeSide: "yes",
      tab: "buy",
      orderMode: "market",
      amount: "1",
      limitPrice: formatDefaultGameTradeLimitPrice(snapshot, "home", "yes"),
      limitExpiration: "never",
      limitExpirationCustom: undefined
    });
  },
  syncForPositionSell: (snapshot, position) => {
    const outcomeSide = resolveOutcomeSideForPosition(position, snapshot);

    set({
      marketKey: snapshot.team.id,
      entityType: "team",
      matchOutcomeSide: "home",
      selectedFixtureOutcome: null,
      outcomeSide,
      tab: "sell",
      orderMode: "market",
      amount: String(resolveMaxSellShares(position.size) ?? position.size),
      limitPrice: formatDefaultTradeLimitPrice(snapshot, outcomeSide),
      limitExpiration: "never",
      limitExpirationCustom: undefined
    });
  },
  setOutcomeSide: (side) => set({ outcomeSide: side }),
  setMatchOutcomeSide: (side) => set({ matchOutcomeSide: side, outcomeSide: "yes" }),
  selectFixtureOutcome: (outcome, binarySide = "yes") => {
    const nextMatchOutcomeSide =
      outcome.side === "home" || outcome.side === "draw" || outcome.side === "away"
        ? outcome.side
        : get().matchOutcomeSide;

    set({
      selectedFixtureOutcome: outcome,
      outcomeSide: binarySide,
      matchOutcomeSide: nextMatchOutcomeSide,
      limitPrice: resolveFixtureSelectionLimitPrice(outcome, binarySide).toFixed(3)
    });
  },
  setTab: (tab) => set({ tab }),
  setOrderMode: (orderMode) => {
    const current = get();

    if (current.orderMode === orderMode) {
      return;
    }

    set({
      orderMode,
      amount: orderMode === "limit" ? "5" : "1",
      limitExpiration: "never",
      limitExpirationCustom: undefined
    });
  },
  setAmount: (amount) => set({ amount }),
  setLimitPrice: (limitPrice) => set({ limitPrice }),
  setLimitExpiration: (limitExpiration) =>
    set({
      limitExpiration,
      limitExpirationCustom:
        limitExpiration === "custom" ? get().limitExpirationCustom : undefined
    }),
  setLimitExpirationCustom: (limitExpirationCustom) =>
    set({ limitExpirationCustom })
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

export function useSelectedFixtureOutcome() {
  return useTradeTicketStore((state) => state.selectedFixtureOutcome);
}

export function useSelectFixtureOutcome() {
  return useTradeTicketStore((state) => state.selectFixtureOutcome);
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

export function useTradeLimitExpiration() {
  return useTradeTicketStore((state) => state.limitExpiration);
}

export function useTradeLimitExpirationCustom() {
  return useTradeTicketStore((state) => state.limitExpirationCustom);
}

export function useSetTradeLimitExpiration() {
  return useTradeTicketStore((state) => state.setLimitExpiration);
}

export function useSetTradeLimitExpirationCustom() {
  return useTradeTicketStore((state) => state.setLimitExpirationCustom);
}

export function useSyncTradeTeamSnapshot() {
  return useTradeTicketStore((state) => state.syncForTeamSnapshot);
}

export function useSyncTradeGameSnapshot() {
  return useTradeTicketStore((state) => state.syncForGameSnapshot);
}

export function useSyncForPositionSell() {
  return useTradeTicketStore((state) => state.syncForPositionSell);
}

/** @deprecated Use useSyncTradeTeamSnapshot instead. */
export function useSyncTradeTicketSnapshot() {
  return useTradeTicketStore((state) => state.syncForTeamSnapshot);
}

function resolveFixtureSelectionLimitPrice(
  outcome: FixtureMarketOutcome,
  binarySide: OrderOutcomeSide
): number {
  if (binarySide === "no") {
  const noPrice = outcome.noAsk ?? outcome.noBid;
    if (noPrice !== undefined && noPrice > 0 && noPrice < 1) {
      return noPrice;
    }

    const yesPrice = outcome.yesAsk ?? outcome.price;
    return Math.max(0.001, Math.min(0.999, 1 - yesPrice));
  }

  return outcome.yesAsk ?? outcome.price;
}
