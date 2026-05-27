"use client";

import { useEffect, useRef, useState } from "react";

import {
  buildMockLivePricesForOutcomes,
  isMockLiveFixtureEnabled,
  resolveMockLiveBaseElapsedSeconds,
} from "@/data/mock/live-fixture-simulation";
import { useMockLiveFixtureStore } from "@/store/mock-live-fixture-store";
import type { FixtureMarketOutcome, WorldCupMatch } from "@/types/market";

export interface UseMockLiveFixtureSimulationOptions {
  match: WorldCupMatch;
  outcomes: FixtureMarketOutcome[];
  enabled?: boolean;
}

export interface UseMockLiveFixtureSimulationResult {
  isActive: boolean;
  tickIndex: number;
  simulatedElapsedSeconds: number;
  pricesByOutcomeId: Record<string, import("@/lib/market/fixture-live-prices").LiveOutcomePrices>;
}

export function useMockLiveFixtureSimulation({
  match,
  outcomes,
  enabled = true,
}: UseMockLiveFixtureSimulationOptions): UseMockLiveFixtureSimulationResult {
  const mockEnabled = isMockLiveFixtureEnabled() && enabled;
  const outcomeIdsKey = outcomes.map((outcome) => outcome.id).join("|");
  const setSimulation = useMockLiveFixtureStore((state) => state.setSimulation);
  const reset = useMockLiveFixtureStore((state) => state.reset);
  const baseElapsedRef = useRef(resolveMockLiveBaseElapsedSeconds(match));
  const [tickIndex, setTickIndex] = useState(0);
  const [simulatedElapsedSeconds, setSimulatedElapsedSeconds] = useState(() =>
    resolveMockLiveBaseElapsedSeconds(match),
  );
  const [pricesByOutcomeId, setPricesByOutcomeId] = useState<
    UseMockLiveFixtureSimulationResult["pricesByOutcomeId"]
  >({});

  useEffect(() => {
    baseElapsedRef.current = resolveMockLiveBaseElapsedSeconds(match);
    setTickIndex(0);
    setSimulatedElapsedSeconds(baseElapsedRef.current);
  }, [match]);

  useEffect(() => {
    if (!mockEnabled) {
      reset();
      setPricesByOutcomeId({});
      return;
    }

    const localTick = 0;
    const localElapsed = baseElapsedRef.current;
    const prices = buildMockLivePricesForOutcomes(outcomes, localTick);

    setTickIndex(localTick);
    setSimulatedElapsedSeconds(localElapsed);
    setPricesByOutcomeId(prices);
    setSimulation({
      matchId: match.id,
      tickIndex: localTick,
      simulatedElapsedSeconds: localElapsed,
      pricesByOutcomeId: prices,
    });
  }, [match.id, mockEnabled, outcomeIdsKey, outcomes, reset, setSimulation]);

  return {
    isActive: mockEnabled,
    tickIndex,
    simulatedElapsedSeconds,
    pricesByOutcomeId,
  };
}
