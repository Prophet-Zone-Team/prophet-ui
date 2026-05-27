"use client";

import { useEffect, useState } from "react";

import { buildMockLiveFixtureChart } from "@/data/mock/live-fixture-probability";
import type {
  FixtureChartKind,
  GameFixtureBinaryChartPoint,
  GameFixtureChartPoint,
  GameFixtureMarketsSnapshot,
  GameMarketSnapshot,
  GameMatchChartEvent,
  WorldCupMatch,
} from "@/types/market";

const EMPTY_RESULT: UseLiveMatchProbabilityChartResult = {
  points: [],
  binaryPoints: [],
  events: [],
  chartMode: "ternary",
  maxElapsedSeconds: 0,
};

export interface LiveChartSimulationTick {
  tickIndex: number;
  simulatedElapsedSeconds: number;
}

export interface UseLiveMatchProbabilityChartOptions {
  match: WorldCupMatch;
  gameSnapshot: GameMarketSnapshot;
  fixtureMarkets: GameFixtureMarketsSnapshot;
  chartKind: FixtureChartKind;
  lineKey?: string;
  enabled: boolean;
  simulation?: LiveChartSimulationTick;
}

export interface UseLiveMatchProbabilityChartResult {
  points: GameFixtureChartPoint[];
  binaryPoints: GameFixtureBinaryChartPoint[];
  events: GameMatchChartEvent[];
  chartMode: "ternary" | "binary";
  maxElapsedSeconds: number;
}

function buildChartResult(
  input: Omit<UseLiveMatchProbabilityChartOptions, "enabled" | "simulation"> & {
    simulation?: LiveChartSimulationTick;
  },
): UseLiveMatchProbabilityChartResult {
  const chartData = buildMockLiveFixtureChart({
    match: input.match,
    gameSnapshot: input.gameSnapshot,
    fixtureMarkets: input.fixtureMarkets,
    chartKind: input.chartKind,
    lineKey: input.lineKey,
    maxElapsedSecondsOverride: input.simulation?.simulatedElapsedSeconds,
    tickIndex: input.simulation?.tickIndex,
  });
  const maxElapsedSeconds =
    input.simulation?.simulatedElapsedSeconds ??
    Math.max(input.match.liveElapsedSeconds ?? 45 * 60, 15 * 60);

  return {
    points: chartData.points,
    binaryPoints: chartData.binaryPoints,
    events: chartData.events,
    chartMode: chartData.chartMode,
    maxElapsedSeconds,
  };
}

export function useLiveMatchProbabilityChart({
  match,
  gameSnapshot,
  fixtureMarkets,
  chartKind,
  lineKey,
  enabled,
  simulation,
}: UseLiveMatchProbabilityChartOptions): UseLiveMatchProbabilityChartResult {
  const [result, setResult] =
    useState<UseLiveMatchProbabilityChartResult>(EMPTY_RESULT);

  useEffect(() => {
    if (!enabled) {
      setResult(EMPTY_RESULT);
      return;
    }

    setResult(
      buildChartResult({
        match,
        gameSnapshot,
        fixtureMarkets,
        chartKind,
        lineKey,
        simulation,
      }),
    );
  }, [
    chartKind,
    enabled,
    fixtureMarkets,
    gameSnapshot,
    lineKey,
    match,
    simulation?.simulatedElapsedSeconds,
    simulation?.tickIndex,
  ]);

  return result;
}
