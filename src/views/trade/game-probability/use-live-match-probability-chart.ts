"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  attachHistoryToBinaryInputs,
  attachHistoryToTernaryInputs,
  buildFixtureChartFetchKey,
  resolveFixtureChartTokens,
} from "@/lib/market/fixture-chart-tokens";
import {
  buildBinaryFixtureChartPoints,
  buildFixtureChartPoints,
} from "@/lib/market/fixture-probability-chart";
import {
  buildLiveChartFallbackPoints,
  mapBinaryFixturePointsToMatchMinutes,
  mapFixturePointsToMatchMinutes,
  resolveEffectiveKickoffAt,
  resolveLiveChartClobInterval,
  resolveLiveChartMaxElapsed,
  resolveLiveChartModeFromKind,
  resolveLiveChartTimeWindow,
} from "@/lib/market/live-fixture-probability-chart";
import {
  postPolymarketClob,
  type PolymarketClobBatchPricesHistoryResponse,
} from "@/lib/market/polymarket-api-client";
import { resolveFixtureOutcomesForTab } from "@/lib/market/fixture-tab-outcomes";
import { useMatchGoalChartEvents } from "@/store/match-live-store";
import type { GameMarketTabId } from "@/views/trade/game/markets/fixture-market-actions";
import type {
  FixtureChartKind,
  GameFixtureBinaryChartPoint,
  GameFixtureChartPoint,
  GameFixtureMarketsSnapshot,
  GameMarketSnapshot,
  GameMatchChartEvent,
  WorldCupMatch,
} from "@/types/market";
import type { ProbabilityChartStatus } from "@/hooks/market/use-probability-chart";

const EMPTY_RESULT: UseLiveMatchProbabilityChartResult = {
  points: [],
  binaryPoints: [],
  events: [],
  chartMode: "ternary",
  maxElapsedSeconds: 0,
  status: "empty",
  error: undefined,
  refetch: async () => {},
};

export interface UseLiveMatchProbabilityChartOptions {
  match: WorldCupMatch;
  gameSnapshot: GameMarketSnapshot;
  fixtureMarkets: GameFixtureMarketsSnapshot;
  chartKind: FixtureChartKind;
  lineKey?: string;
  enabled: boolean;
  pollIntervalMs?: number;
}

export interface UseLiveMatchProbabilityChartResult {
  points: GameFixtureChartPoint[];
  binaryPoints: GameFixtureBinaryChartPoint[];
  events: GameMatchChartEvent[];
  chartMode: "ternary" | "binary";
  maxElapsedSeconds: number;
  status: ProbabilityChartStatus;
  error?: string;
  refetch: () => Promise<void>;
}

function historyResponseToMap(
  history: PolymarketClobBatchPricesHistoryResponse["history"],
): Map<string, Array<{ t: number; p: number }>> {
  const result = new Map<string, Array<{ t: number; p: number }>>();

  if (!history) {
    return result;
  }

  for (const [tokenId, points] of Object.entries(history)) {
    result.set(tokenId, points ?? []);
  }

  return result;
}

function chartKindToTab(chartKind: FixtureChartKind): GameMarketTabId {
  switch (chartKind) {
    case "total":
      return "totals";
    case "spread":
      return "spreads";
    case "halftime":
      return "halftime";
    default:
      return "moneyline";
  }
}

function buildFallbackChartData(input: {
  match: WorldCupMatch;
  gameSnapshot: GameMarketSnapshot;
  fixtureMarkets: GameFixtureMarketsSnapshot;
  chartKind: FixtureChartKind;
  lineKey?: string;
  kickoffAt?: string;
}): {
  chartMode: "ternary" | "binary";
  points: GameFixtureChartPoint[];
  binaryPoints: GameFixtureBinaryChartPoint[];
} {
  const kickoffAt =
    input.kickoffAt ?? resolveEffectiveKickoffAt(input.match);

  if (!kickoffAt) {
    return { chartMode: "ternary", points: [], binaryPoints: [] };
  }

  const chartMode = resolveLiveChartModeFromKind(input.chartKind);

  if (chartMode === "binary") {
    const outcomes = resolveFixtureOutcomesForTab(
      input.fixtureMarkets,
      chartKindToTab(input.chartKind),
      input.lineKey,
    ).slice(0, 2);

    return buildLiveChartFallbackPoints({
      matchId: input.match.id,
      kickoffAt,
      chartMode: "binary",
      binary: {
        primary: outcomes[0]?.probability ?? 50,
        secondary: outcomes[1]?.probability ?? 50,
      },
    });
  }

  const home = input.gameSnapshot.outcomes.find((item) => item.side === "home");
  const draw = input.gameSnapshot.outcomes.find((item) => item.side === "draw");
  const away = input.gameSnapshot.outcomes.find((item) => item.side === "away");

  return buildLiveChartFallbackPoints({
    matchId: input.match.id,
    kickoffAt,
    chartMode: "ternary",
    ternary: {
      home: home?.probability ?? 33.3,
      draw: draw?.probability ?? 33.3,
      away: away?.probability ?? 33.3,
    },
  });
}

export function useLiveMatchProbabilityChart({
  match,
  gameSnapshot,
  fixtureMarkets,
  chartKind,
  lineKey,
  enabled,
  pollIntervalMs = 5000,
}: UseLiveMatchProbabilityChartOptions): UseLiveMatchProbabilityChartResult {
  const matchRef = useRef(match);
  const gameSnapshotRef = useRef(gameSnapshot);
  const fixtureMarketsRef = useRef(fixtureMarkets);
  const fetchKey = buildFixtureChartFetchKey(match, chartKind, lineKey);
  const goalEvents = useMatchGoalChartEvents(match);

  useEffect(() => {
    matchRef.current = match;
    gameSnapshotRef.current = gameSnapshot;
    fixtureMarketsRef.current = fixtureMarkets;
  }, [fixtureMarkets, gameSnapshot, match]);

  const [points, setPoints] = useState<GameFixtureChartPoint[]>([]);
  const [binaryPoints, setBinaryPoints] = useState<GameFixtureBinaryChartPoint[]>(
    [],
  );
  const [chartMode, setChartMode] = useState<"ternary" | "binary">("ternary");
  const [status, setStatus] = useState<ProbabilityChartStatus>("loading");
  const [error, setError] = useState<string | undefined>();

  const fetchHistory = useCallback(
    async (signal?: AbortSignal) => {
      if (!enabled) {
        return;
      }

      const currentMatch = matchRef.current;
      const currentGameSnapshot = gameSnapshotRef.current;
      const currentFixtureMarkets = fixtureMarketsRef.current;
      const kickoffAt = resolveEffectiveKickoffAt(currentMatch);

      const applyFallback = (kickoffOverride?: string) => {
        const fallback = buildFallbackChartData({
          match: currentMatch,
          gameSnapshot: currentGameSnapshot,
          fixtureMarkets: currentFixtureMarkets,
          chartKind,
          lineKey,
          kickoffAt: kickoffOverride ?? kickoffAt,
        });

        setPoints(fallback.points);
        setBinaryPoints(fallback.binaryPoints);
        setChartMode(fallback.chartMode);
        setStatus(
          fallback.points.length > 0 || fallback.binaryPoints.length > 0
            ? "ready"
            : "empty",
        );
        setError(undefined);
      };

      if (!kickoffAt) {
        applyFallback();
        return;
      }

      const timeWindow = resolveLiveChartTimeWindow(kickoffAt);

      if (!timeWindow) {
        applyFallback();
        return;
      }

      const tokenResolution = resolveFixtureChartTokens(
        currentMatch,
        chartKind,
        lineKey,
      );

      if (!tokenResolution) {
        applyFallback(kickoffAt);
        return;
      }

      try {
        const tokenIds = tokenResolution.inputs.map((input) => input.tokenId);
        const payload =
          await postPolymarketClob<PolymarketClobBatchPricesHistoryResponse>(
            "/batch-prices-history",
            {
              markets: tokenIds,
              interval: resolveLiveChartClobInterval(
                timeWindow.startTs,
                timeWindow.endTs,
              ),
              start_ts: timeWindow.startTs,
              end_ts: timeWindow.endTs,
            },
            { signal },
          );

        const historyByToken = historyResponseToMap(payload.history);

        if (tokenResolution.mode === "ternary") {
          const rawPoints = buildFixtureChartPoints(
            currentMatch.id,
            attachHistoryToTernaryInputs(tokenResolution.inputs, historyByToken),
          );
          const nextPoints = mapFixturePointsToMatchMinutes(rawPoints, kickoffAt);

          if (nextPoints.length === 0) {
            applyFallback(kickoffAt);
          } else {
            setPoints(nextPoints);
            setBinaryPoints([]);
            setChartMode("ternary");
            setStatus("ready");
            setError(undefined);
          }
        } else {
          const rawBinaryPoints = buildBinaryFixtureChartPoints(
            currentMatch.id,
            attachHistoryToBinaryInputs(tokenResolution.inputs, historyByToken),
          );
          const nextBinaryPoints = mapBinaryFixturePointsToMatchMinutes(
            rawBinaryPoints,
            kickoffAt,
          );

          if (nextBinaryPoints.length === 0) {
            applyFallback(kickoffAt);
          } else {
            setPoints([]);
            setBinaryPoints(nextBinaryPoints);
            setChartMode("binary");
            setStatus("ready");
            setError(undefined);
          }
        }
      } catch (fetchError) {
        if (signal?.aborted) {
          throw fetchError;
        }

        applyFallback(kickoffAt);
      }
    },
    [chartKind, enabled, fetchKey, lineKey],
  );

  const refetch = useCallback(async () => {
    if (!enabled) {
      setPoints([]);
      setBinaryPoints([]);
      setChartMode("ternary");
      setStatus("empty");
      setError(undefined);
      return;
    }

    setError(undefined);

    try {
      await fetchHistory();
    } catch (fetchError) {
      setStatus("error");
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Unable to load live probability chart history.",
      );
    }
  }, [enabled, fetchHistory]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const controller = new AbortController();
    let timeoutId: number | undefined;
    let isInitialFetch = true;

    const poll = async () => {
      if (controller.signal.aborted) {
        return;
      }

      if (isInitialFetch) {
        setStatus("loading");
        setError(undefined);
      }

      try {
        await fetchHistory(controller.signal);
        isInitialFetch = false;
      } catch {
        if (controller.signal.aborted) {
          return;
        }

        isInitialFetch = false;
      }

      if (controller.signal.aborted || pollIntervalMs === undefined) {
        return;
      }

      timeoutId = window.setTimeout(() => {
        void poll();
      }, pollIntervalMs);
    };

    void poll();

    return () => {
      controller.abort();
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [enabled, fetchHistory, fetchKey, pollIntervalMs]);

  const effectiveKickoffAt = useMemo(
    () => resolveEffectiveKickoffAt(match),
    [
      match.id,
      match.kickoffAt,
      match.liveElapsedSeconds,
      match.polymarket?.slug,
      match.status,
    ],
  );

  const maxElapsedSeconds = useMemo(() => {
    if (!enabled || !effectiveKickoffAt) {
      return 0;
    }

    return resolveLiveChartMaxElapsed(
      effectiveKickoffAt,
      chartMode === "binary" ? binaryPoints : points,
      "1D",
      match.liveElapsedSeconds
    );
  }, [binaryPoints, chartMode, effectiveKickoffAt, enabled, points]);

  if (!enabled) {
    return EMPTY_RESULT;
  }

  return {
    points,
    binaryPoints,
    events: goalEvents,
    chartMode,
    maxElapsedSeconds,
    status,
    error,
    refetch,
  };
}
