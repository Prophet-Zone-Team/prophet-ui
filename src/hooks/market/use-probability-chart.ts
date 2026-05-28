"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
  postPolymarketClob,
  type PolymarketClobBatchPricesHistoryResponse,
} from "@/lib/market/polymarket-api-client";
import {
  buildTeamProbabilityHistoryFromClob,
  DEFAULT_PROBABILITY_CHART_CLOB_INTERVAL,
  resolveProbabilityChartTimeWindow,
} from "@/lib/team/probability-history";
import type {
  FixtureChartKind,
  GameFixtureBinaryChartPoint,
  GameFixtureChartPoint,
  ProbabilityHistoryPoint,
  WorldCupMatch,
} from "@/types/market";

export type ProbabilityChartStatus = "loading" | "ready" | "empty" | "error";

export interface UseProbabilityChartTeamOptions {
  kind: "team";
  tokenId: string | undefined;
  entityId: string;
  enabled?: boolean;
  pollIntervalMs?: number;
}

export interface UseProbabilityChartFixtureOptions {
  kind: "fixture";
  match: WorldCupMatch;
  chartKind?: FixtureChartKind;
  lineKey?: string;
  enabled?: boolean;
  pollIntervalMs?: number;
}

export type UseProbabilityChartOptions =
  | UseProbabilityChartTeamOptions
  | UseProbabilityChartFixtureOptions;

export interface UseProbabilityChartTeamResult {
  kind: "team";
  points: ProbabilityHistoryPoint[];
  status: ProbabilityChartStatus;
  lastUpdated?: string;
  error?: string;
  refetch: () => Promise<void>;
}

export interface UseProbabilityChartFixtureResult {
  kind: "fixture";
  points: GameFixtureChartPoint[];
  binaryPoints: GameFixtureBinaryChartPoint[];
  chartMode: "ternary" | "binary";
  status: ProbabilityChartStatus;
  lastUpdated?: string;
  error?: string;
  refetch: () => Promise<void>;
}

export type UseProbabilityChartResult =
  | UseProbabilityChartTeamResult
  | UseProbabilityChartFixtureResult;

const DISABLED_TEAM_CHART_OPTIONS: UseProbabilityChartTeamOptions = {
  kind: "team",
  tokenId: undefined,
  entityId: "__disabled__",
  enabled: false,
};

const DISABLED_FIXTURE_CHART_OPTIONS: UseProbabilityChartFixtureOptions = {
  kind: "fixture",
  match: {
    id: "__disabled__",
    matchId: 0,
    stage: "EXTERNAL",
    status: "unknown",
    freshness: { source: "disabled", status: "unavailable" },
  },
  enabled: false,
};

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

export function useProbabilityChart(
  options: UseProbabilityChartTeamOptions,
): UseProbabilityChartTeamResult;
export function useProbabilityChart(
  options: UseProbabilityChartFixtureOptions,
): UseProbabilityChartFixtureResult;
export function useProbabilityChart(
  options: UseProbabilityChartOptions,
): UseProbabilityChartResult {
  const teamResult = useProbabilityChartTeam(
    options.kind === "team" ? options : DISABLED_TEAM_CHART_OPTIONS,
  );
  const fixtureResult = useProbabilityChartFixture(
    options.kind === "fixture" ? options : DISABLED_FIXTURE_CHART_OPTIONS,
  );

  return options.kind === "team" ? teamResult : fixtureResult;
}

function useProbabilityChartTeam(
  options: UseProbabilityChartTeamOptions,
): UseProbabilityChartTeamResult {
  const { tokenId, entityId, enabled = true, pollIntervalMs } = options;

  const [points, setPoints] = useState<ProbabilityHistoryPoint[]>([]);
  const [status, setStatus] = useState<ProbabilityChartStatus>("loading");
  const [lastUpdated, setLastUpdated] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  const fetchHistory = useCallback(
    async (signal?: AbortSignal) => {
      if (!tokenId || !enabled) {
        return false;
      }

      const { startTs, endTs } = resolveProbabilityChartTimeWindow();
      const payload =
        await postPolymarketClob<PolymarketClobBatchPricesHistoryResponse>(
          "/batch-prices-history",
          {
            markets: [tokenId],
            interval: DEFAULT_PROBABILITY_CHART_CLOB_INTERVAL,
            start_ts: startTs,
            end_ts: endTs,
          },
          { signal },
        );

      const rawPoints = payload.history?.[tokenId] ?? [];
      const nextPoints = buildTeamProbabilityHistoryFromClob(
        entityId,
        rawPoints,
      );

      setPoints(nextPoints);
      setLastUpdated(new Date().toISOString());
      setStatus(nextPoints.length > 0 ? "ready" : "empty");
      setError(undefined);

      return true;
    },
    [enabled, entityId, tokenId],
  );

  const refetch = useCallback(async () => {
    if (!tokenId || !enabled) {
      setPoints([]);
      setStatus("empty");
      setLastUpdated(undefined);
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
          : "Unable to load probability chart history.",
      );
    }
  }, [enabled, fetchHistory, tokenId]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (!tokenId) {
      setPoints([]);
      setStatus("empty");
      setLastUpdated(undefined);
      setError(undefined);
      return;
    }

    const controller = new AbortController();
    let timeoutId: number | undefined;
    let isInitialFetch = true;

    const poll = async () => {
      if (isInitialFetch) {
        setStatus("loading");
        setError(undefined);
      }

      try {
        const success = await fetchHistory(controller.signal);

        if (!success || controller.signal.aborted) {
          return;
        }

        isInitialFetch = false;

        if (pollIntervalMs === undefined) {
          return;
        }

        timeoutId = window.setTimeout(() => {
          void poll();
        }, pollIntervalMs);
      } catch {
        if (controller.signal.aborted) {
          return;
        }

        if (isInitialFetch) {
          setPoints([]);
          setStatus("error");
          setError("Unable to load probability chart history.");
        }

        isInitialFetch = false;
      }
    };

    void poll();

    return () => {
      controller.abort();
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [enabled, fetchHistory, pollIntervalMs, tokenId]);

  return {
    kind: "team",
    points,
    status,
    lastUpdated,
    error,
    refetch,
  };
}

function useProbabilityChartFixture(
  options: UseProbabilityChartFixtureOptions,
): UseProbabilityChartFixtureResult {
  const {
    match,
    chartKind = "moneyline",
    lineKey,
    enabled = true,
    pollIntervalMs,
  } = options;

  const matchRef = useRef(match);
  const fetchKey = buildFixtureChartFetchKey(match, chartKind, lineKey);

  useEffect(() => {
    matchRef.current = match;
  }, [match]);

  const [points, setPoints] = useState<GameFixtureChartPoint[]>([]);
  const [binaryPoints, setBinaryPoints] = useState<GameFixtureBinaryChartPoint[]>(
    [],
  );
  const [chartMode, setChartMode] = useState<"ternary" | "binary">("ternary");
  const [status, setStatus] = useState<ProbabilityChartStatus>("loading");
  const [lastUpdated, setLastUpdated] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  const fetchHistory = useCallback(
    async (signal?: AbortSignal) => {
      if (!enabled) {
        return false;
      }

      const currentMatch = matchRef.current;
      const tokenResolution = resolveFixtureChartTokens(
        currentMatch,
        chartKind,
        lineKey,
      );

      if (!tokenResolution) {
        setPoints([]);
        setBinaryPoints([]);
        setChartMode("ternary");
        setStatus("empty");
        setLastUpdated(undefined);
        setError(undefined);
        return false;
      }

      const tokenIds = tokenResolution.inputs.map((input) => input.tokenId);
      const { startTs, endTs } = resolveProbabilityChartTimeWindow();
      const payload =
        await postPolymarketClob<PolymarketClobBatchPricesHistoryResponse>(
          "/batch-prices-history",
          {
            markets: tokenIds,
            interval: DEFAULT_PROBABILITY_CHART_CLOB_INTERVAL,
            start_ts: startTs,
            end_ts: endTs,
          },
          { signal },
        );

      const historyByToken = historyResponseToMap(payload.history);

      if (tokenResolution.mode === "ternary") {
        const nextPoints = buildFixtureChartPoints(
          currentMatch.id,
          attachHistoryToTernaryInputs(tokenResolution.inputs, historyByToken),
        );

        setPoints(nextPoints);
        setBinaryPoints([]);
        setChartMode("ternary");
        setStatus(nextPoints.length > 0 ? "ready" : "empty");
      } else {
        const nextBinaryPoints = buildBinaryFixtureChartPoints(
          currentMatch.id,
          attachHistoryToBinaryInputs(tokenResolution.inputs, historyByToken),
        );

        setPoints([]);
        setBinaryPoints(nextBinaryPoints);
        setChartMode("binary");
        setStatus(nextBinaryPoints.length > 0 ? "ready" : "empty");
      }

      setLastUpdated(new Date().toISOString());
      setError(undefined);

      return true;
    },
    [chartKind, enabled, fetchKey, lineKey],
  );

  const refetch = useCallback(async () => {
    if (!enabled) {
      setPoints([]);
      setBinaryPoints([]);
      setStatus("empty");
      setLastUpdated(undefined);
      setError(undefined);
      return;
    }

    const tokenResolution = resolveFixtureChartTokens(
      matchRef.current,
      chartKind,
      lineKey,
    );

    if (!tokenResolution) {
      setPoints([]);
      setBinaryPoints([]);
      setStatus("empty");
      setLastUpdated(undefined);
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
          : "Unable to load probability chart history.",
      );
    }
  }, [chartKind, enabled, fetchHistory, lineKey]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const controller = new AbortController();
    let timeoutId: number | undefined;
    let isInitialFetch = true;

    const poll = async () => {
      if (isInitialFetch) {
        setStatus("loading");
        setError(undefined);
      }

      try {
        const success = await fetchHistory(controller.signal);

        if (!success || controller.signal.aborted) {
          return;
        }

        isInitialFetch = false;

        if (pollIntervalMs === undefined) {
          return;
        }

        timeoutId = window.setTimeout(() => {
          void poll();
        }, pollIntervalMs);
      } catch {
        if (controller.signal.aborted) {
          return;
        }

        if (isInitialFetch) {
          setPoints([]);
          setBinaryPoints([]);
          setStatus("error");
          setError("Unable to load probability chart history.");
        }

        isInitialFetch = false;
      }
    };

    void poll();

    return () => {
      controller.abort();
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [enabled, fetchHistory, fetchKey, pollIntervalMs]);

  return {
    kind: "fixture",
    points,
    binaryPoints,
    chartMode,
    status,
    lastUpdated,
    error,
    refetch,
  };
}
