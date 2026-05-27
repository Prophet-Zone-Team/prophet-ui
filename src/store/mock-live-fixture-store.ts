"use client";

import { create } from "zustand";

import type { LiveOutcomePrices } from "@/lib/market/fixture-live-prices";

interface MockLiveFixtureState {
  matchId: string | null;
  tickIndex: number;
  simulatedElapsedSeconds: number;
  pricesByOutcomeId: Record<string, LiveOutcomePrices>;
  setSimulation: (payload: {
    matchId: string;
    tickIndex: number;
    simulatedElapsedSeconds: number;
    pricesByOutcomeId: Record<string, LiveOutcomePrices>;
  }) => void;
  reset: () => void;
}

const initialState = {
  matchId: null as string | null,
  tickIndex: 0,
  simulatedElapsedSeconds: 0,
  pricesByOutcomeId: {} as Record<string, LiveOutcomePrices>,
};

export const useMockLiveFixtureStore = create<MockLiveFixtureState>()((set) => ({
  ...initialState,
  setSimulation: (payload) => set(payload),
  reset: () => set(initialState),
}));

export function useMockLiveFixtureElapsed(matchId: string): number | undefined {
  return useMockLiveFixtureStore((state) =>
    state.matchId === matchId ? state.simulatedElapsedSeconds : undefined,
  );
}

export function useMockLiveFixturePricesForOutcome(
  outcomeId: string | undefined,
): LiveOutcomePrices | undefined {
  return useMockLiveFixtureStore((state) =>
    outcomeId ? state.pricesByOutcomeId[outcomeId] : undefined,
  );
}
