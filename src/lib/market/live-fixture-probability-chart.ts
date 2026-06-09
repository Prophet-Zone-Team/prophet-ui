import { formatChartTimestampClockLabel } from "@/lib/market/match-display";
import { getScheduleRowVariant } from "@/lib/market/schedule-match";
import type { FixtureHistoryInterval } from "@/server/market/clob-prices-history";
import type {
  FixtureChartKind,
  GameFixtureBinaryChartPoint,
  GameFixtureChartPoint,
  GameFixtureChartTimeRange,
  WorldCupMatch
} from "@/types/market";

export function parseKickoffTimestampMs(value: string): number | undefined {
  const trimmed = value.trim();

  if (/^\d+$/.test(trimmed)) {
    const numeric = Number(trimmed);

    if (!Number.isFinite(numeric)) {
      return undefined;
    }

    return numeric < 1e12 ? numeric * 1000 : numeric;
  }

  const parsed = Date.parse(trimmed);

  return Number.isNaN(parsed) ? undefined : parsed;
}

export function resolveKickoffAtFromMatchSlug(
  slug: string | undefined
): string | undefined {
  if (!slug) {
    return undefined;
  }

  const match = slug.match(/(\d{4}-\d{2}-\d{2})$/);

  if (!match) {
    return undefined;
  }

  return `${match[1]}T00:00:00.000Z`;
}

export function resolveMatchClockElapsedSeconds(
  liveElapsedSeconds: number | undefined,
  goalEvents: Array<{ elapsedSeconds: number }> = []
): number | undefined {
  const goalMax = goalEvents.reduce(
    (max, event) => Math.max(max, event.elapsedSeconds),
    0
  );
  const elapsed = Math.max(liveElapsedSeconds ?? 0, goalMax);

  return elapsed > 0 ? elapsed : undefined;
}

/**
 * Kickoff for live CLOB `/batch-prices-history` and x-axis elapsed.
 * Aligns with game `start_time` / `kickoffAt` so point `t` maps to `t - start_ts`.
 */
export function resolveLiveChartPriceHistoryKickoffAt(
  match: WorldCupMatch,
  nowMs = Date.now()
): string | undefined {
  if (match.kickoffAt) {
    const kickoffMs = parseKickoffTimestampMs(match.kickoffAt);

    if (kickoffMs !== undefined && kickoffMs <= nowMs) {
      return new Date(kickoffMs).toISOString();
    }
  }

  const slugKickoff = resolveKickoffAtFromMatchSlug(
    match.id || match.polymarket?.slug
  );

  if (slugKickoff) {
    const slugKickoffMs = parseKickoffTimestampMs(slugKickoff);

    if (slugKickoffMs !== undefined && slugKickoffMs <= nowMs) {
      return slugKickoff;
    }
  }

  return resolveEffectiveKickoffAt(match, nowMs, match.liveElapsedSeconds);
}

export function resolveEffectiveKickoffAt(
  match: WorldCupMatch,
  nowMs = Date.now(),
  matchClockElapsedSeconds?: number
): string | undefined {
  const isLive = getScheduleRowVariant(match.status) === "ongoing";
  const elapsedSeconds =
    matchClockElapsedSeconds ?? match.liveElapsedSeconds;

  // Live charts and statistics goal events use game elapsed time (match clock).
  // Back-calculate kickoff from match elapsed so x-axis seconds exclude halftime gaps.
  if (isLive && elapsedSeconds !== undefined && elapsedSeconds >= 0) {
    return new Date(nowMs - elapsedSeconds * 1000).toISOString();
  }

  if (match.kickoffAt) {
    const kickoffMs = parseKickoffTimestampMs(match.kickoffAt);

    if (kickoffMs !== undefined && kickoffMs <= nowMs) {
      return new Date(kickoffMs).toISOString();
    }
  }

  if (isLive) {
    return new Date(nowMs).toISOString();
  }

  const slugKickoff = resolveKickoffAtFromMatchSlug(
    match.id || match.polymarket?.slug
  );

  if (slugKickoff) {
    const slugKickoffMs = parseKickoffTimestampMs(slugKickoff);

    if (slugKickoffMs !== undefined && slugKickoffMs <= nowMs) {
      return slugKickoff;
    }
  }

  if (match.kickoffAt) {
    const kickoffMs = parseKickoffTimestampMs(match.kickoffAt);

    if (kickoffMs !== undefined) {
      return new Date(kickoffMs).toISOString();
    }
  }

  return slugKickoff;
}

export function resolveLiveChartTimeWindow(
  kickoffAt: string,
  nowMs = Date.now()
): { startTs: number; endTs: number } | undefined {
  const kickoffMs = parseKickoffTimestampMs(kickoffAt);

  if (kickoffMs === undefined) {
    return undefined;
  }

  const endTs = Math.floor(nowMs / 1000);
  const startTs = Math.floor(kickoffMs / 1000);

  if (startTs > endTs) {
    return undefined;
  }

  return { startTs, endTs };
}

export function resolveLiveChartClobInterval(
  startTs: number,
  endTs: number
): FixtureHistoryInterval {
  const durationSeconds = Math.max(0, endTs - startTs);

  if (durationSeconds <= 60 * 60) {
    return "1h";
  }

  if (durationSeconds <= 24 * 60 * 60) {
    return "1d";
  }

  return "all";
}

export type ClobPriceHistoryPoint = { t: number; p: number };

/**
 * Keep only `/batch-prices-history` samples at or after match `start_ts` (kickoff).
 */
export function filterPriceHistoryByMatchStart(
  historyByToken: Map<string, ClobPriceHistoryPoint[]>,
  matchStartTs: number
): Map<string, ClobPriceHistoryPoint[]> {
  const filtered = new Map<string, ClobPriceHistoryPoint[]>();

  for (const [tokenId, points] of historyByToken.entries()) {
    filtered.set(
      tokenId,
      points.filter((point) => point.t >= matchStartTs)
    );
  }

  return filtered;
}

export function resolveKickoffElapsedSeconds(
  kickoffAt: string,
  nowMs = Date.now()
): number | undefined {
  const kickoffMs = parseKickoffTimestampMs(kickoffAt);

  if (kickoffMs === undefined) {
    return undefined;
  }

  return Math.max(0, Math.floor((nowMs - kickoffMs) / 1000));
}

export function mapFixturePointsToElapsedFromStartTs(
  points: GameFixtureChartPoint[],
  startTs: number
): GameFixtureChartPoint[] {
  const mapped: GameFixtureChartPoint[] = [];

  for (const point of points) {
    const timestampSeconds = Math.floor(Date.parse(point.timestamp) / 1000);

    if (Number.isNaN(timestampSeconds) || timestampSeconds < startTs) {
      continue;
    }

    const elapsedSeconds = timestampSeconds - startTs;

    mapped.push({
      ...point,
      elapsedSeconds,
      label: formatChartTimestampClockLabel(point.timestamp),
    });
  }

  return mapped.sort(
    (left, right) => (left.elapsedSeconds ?? 0) - (right.elapsedSeconds ?? 0)
  );
}

export function mapBinaryFixturePointsToElapsedFromStartTs(
  points: GameFixtureBinaryChartPoint[],
  startTs: number
): GameFixtureBinaryChartPoint[] {
  const mapped: GameFixtureBinaryChartPoint[] = [];

  for (const point of points) {
    const timestampSeconds = Math.floor(Date.parse(point.timestamp) / 1000);

    if (Number.isNaN(timestampSeconds) || timestampSeconds < startTs) {
      continue;
    }

    const elapsedSeconds = timestampSeconds - startTs;

    mapped.push({
      ...point,
      elapsedSeconds,
      label: formatChartTimestampClockLabel(point.timestamp),
    });
  }

  return mapped.sort(
    (left, right) => (left.elapsedSeconds ?? 0) - (right.elapsedSeconds ?? 0)
  );
}

/** @deprecated Prefer mapFixturePointsToElapsedFromStartTs with API `start_ts`. */
export function mapFixturePointsToMatchMinutes(
  points: GameFixtureChartPoint[],
  kickoffAt: string
): GameFixtureChartPoint[] {
  const kickoffMs = parseKickoffTimestampMs(kickoffAt);

  if (kickoffMs === undefined) {
    return [];
  }

  return mapFixturePointsToElapsedFromStartTs(
    points,
    Math.floor(kickoffMs / 1000)
  );
}

/** @deprecated Prefer mapBinaryFixturePointsToElapsedFromStartTs with API `start_ts`. */
export function mapBinaryFixturePointsToMatchMinutes(
  points: GameFixtureBinaryChartPoint[],
  kickoffAt: string
): GameFixtureBinaryChartPoint[] {
  const kickoffMs = parseKickoffTimestampMs(kickoffAt);

  if (kickoffMs === undefined) {
    return [];
  }

  return mapBinaryFixturePointsToElapsedFromStartTs(
    points,
    Math.floor(kickoffMs / 1000)
  );
}

/** Baseline live chart x-axis spans 0' through 90'. */
export const LIVE_MATCH_CHART_AXIS_MAX_ELAPSED_SECONDS = 90 * 60;

/** Extra x-axis padding after match elapsed exceeds 60 minutes. */
export const LIVE_MATCH_CHART_OVERTIME_PADDING_SECONDS = 10 * 60;

export const LIVE_MATCH_CHART_AXIS_TICK_STEP_SECONDS = 15 * 60;

export function resolveLiveChartAxisMaxElapsed(
  matchElapsedSeconds: number
): number {
  if (matchElapsedSeconds > LIVE_MATCH_CHART_AXIS_MAX_ELAPSED_SECONDS) {
    return matchElapsedSeconds + LIVE_MATCH_CHART_OVERTIME_PADDING_SECONDS;
  }

  return LIVE_MATCH_CHART_AXIS_MAX_ELAPSED_SECONDS;
}

export function resolveLiveChartAxisTicks(maxElapsedSeconds: number): number[] {
  const ticks: number[] = [];

  for (
    let seconds = 0;
    seconds <= maxElapsedSeconds;
    seconds += LIVE_MATCH_CHART_AXIS_TICK_STEP_SECONDS
  ) {
    ticks.push(seconds);
  }

  return ticks;
}

export function resolveLiveChartWindowSeconds(
  timeRange: GameFixtureChartTimeRange,
  matchElapsedSeconds: number
): number | undefined {
  if (timeRange === "1H") {
    return resolveLiveChartAxisMaxElapsed(matchElapsedSeconds);
  }

  return undefined;
}

function resolveKickoffTimestampFromPoint(point: {
  timestamp: string;
  elapsedSeconds?: number;
}): string {
  const elapsed = point.elapsedSeconds ?? 0;

  if (elapsed <= 0) {
    return point.timestamp;
  }

  const timestampMs = Date.parse(point.timestamp);

  if (Number.isNaN(timestampMs)) {
    return point.timestamp;
  }

  return new Date(timestampMs - elapsed * 1000).toISOString();
}

function ensureLiveTernaryChartLinePoints(
  points: GameFixtureChartPoint[]
): GameFixtureChartPoint[] {
  if (points.length >= 2) {
    return points;
  }

  if (points.length === 0) {
    return points;
  }

  const only = points[0]!;
  const elapsed = only.elapsedSeconds ?? 0;

  if (elapsed <= 0) {
    return points;
  }

  return [
    {
      ...only,
      elapsedSeconds: 0,
      timestamp: resolveKickoffTimestampFromPoint(only),
      label: formatChartTimestampClockLabel(
        resolveKickoffTimestampFromPoint(only)
      )
    },
    only
  ];
}

function ensureLiveBinaryChartLinePoints(
  points: GameFixtureBinaryChartPoint[]
): GameFixtureBinaryChartPoint[] {
  if (points.length >= 2) {
    return points;
  }

  if (points.length === 0) {
    return points;
  }

  const only = points[0]!;
  const elapsed = only.elapsedSeconds ?? 0;

  if (elapsed <= 0) {
    return points;
  }

  const kickoffTimestamp = resolveKickoffTimestampFromPoint(only);

  return [
    {
      ...only,
      elapsedSeconds: 0,
      timestamp: kickoffTimestamp,
      label: formatChartTimestampClockLabel(kickoffTimestamp)
    },
    only
  ];
}

function resolveLiveChartDataMax(
  points: Array<{ elapsedSeconds?: number }>,
  matchElapsedSeconds?: number
): number {
  const pointMax = points.reduce(
    (max, point) => Math.max(max, point.elapsedSeconds ?? 0),
    0
  );

  return Math.max(matchElapsedSeconds ?? 0, pointMax);
}

export function filterLiveFixtureChartByRange(
  points: GameFixtureChartPoint[],
  timeRange: GameFixtureChartTimeRange,
  matchElapsedSeconds?: number
): GameFixtureChartPoint[] {
  const dataMax = resolveLiveChartDataMax(points, matchElapsedSeconds);
  const windowSeconds = resolveLiveChartWindowSeconds(timeRange, dataMax);
  const filtered =
    windowSeconds === undefined
      ? points
      : points.filter((point) => (point.elapsedSeconds ?? 0) <= windowSeconds);

  return ensureLiveTernaryChartLinePoints(filtered);
}

export function filterLiveBinaryFixtureChartByRange(
  points: GameFixtureBinaryChartPoint[],
  timeRange: GameFixtureChartTimeRange,
  matchElapsedSeconds?: number
): GameFixtureBinaryChartPoint[] {
  const dataMax = resolveLiveChartDataMax(points, matchElapsedSeconds);
  const windowSeconds = resolveLiveChartWindowSeconds(timeRange, dataMax);
  const filtered =
    windowSeconds === undefined
      ? points
      : points.filter((point) => (point.elapsedSeconds ?? 0) <= windowSeconds);

  return ensureLiveBinaryChartLinePoints(filtered);
}

export function filterLiveChartEventsByRange<
  T extends { elapsedSeconds: number }
>(
  events: T[],
  timeRange: GameFixtureChartTimeRange,
  matchElapsedSeconds?: number
): T[] {
  const dataMax = resolveLiveChartDataMax(events, matchElapsedSeconds);
  const windowSeconds = resolveLiveChartWindowSeconds(timeRange, dataMax);

  if (windowSeconds === undefined) {
    return events;
  }

  return events.filter((event) => event.elapsedSeconds <= windowSeconds);
}

export function resolveLiveChartMaxElapsed(
  kickoffAt: string | undefined,
  points: Array<{ elapsedSeconds?: number }> = [],
  timeRange: GameFixtureChartTimeRange = "1H",
  liveElapsedSeconds?: number,
  nowMs = Date.now()
): number {
  const elapsedFromKickoff =
    liveElapsedSeconds ??
    (kickoffAt ? resolveKickoffElapsedSeconds(kickoffAt, nowMs) : undefined) ??
    0;

  const dataMax = resolveLiveChartDataMax(points, elapsedFromKickoff);
  const windowSeconds = resolveLiveChartWindowSeconds(timeRange, dataMax);

  if (windowSeconds !== undefined) {
    return windowSeconds;
  }

  return resolveLiveChartAxisMaxElapsed(dataMax);
}

export interface LiveChartFallbackTernaryValues {
  home: number;
  draw: number;
  away: number;
}

export interface LiveChartFallbackBinaryValues {
  primary: number;
  secondary: number;
}

export interface BuildLiveChartFallbackInput {
  matchId: string;
  kickoffAt: string;
  chartMode: "ternary" | "binary";
  ternary?: LiveChartFallbackTernaryValues;
  binary?: LiveChartFallbackBinaryValues;
  nowMs?: number;
}

function buildElapsedChartPointTimestamps(
  kickoffAt: string,
  elapsedSeconds: number,
  nowMs: number
): string {
  if (elapsedSeconds <= 0) {
    return kickoffAt;
  }

  const kickoffMs = parseKickoffTimestampMs(kickoffAt);

  if (kickoffMs === undefined) {
    return new Date(nowMs).toISOString();
  }

  return new Date(kickoffMs + elapsedSeconds * 1000).toISOString();
}

export function buildLiveChartFallbackPoints(
  input: BuildLiveChartFallbackInput
): {
  chartMode: "ternary" | "binary";
  points: GameFixtureChartPoint[];
  binaryPoints: GameFixtureBinaryChartPoint[];
} {
  const nowMs = input.nowMs ?? Date.now();
  const currentElapsed =
    resolveKickoffElapsedSeconds(input.kickoffAt, nowMs) ?? 0;
  const elapsedMarks = currentElapsed > 0 ? [0, currentElapsed] : [0];

  if (input.chartMode === "binary" && input.binary) {
    const binaryPoints = elapsedMarks.map((elapsedSeconds) => {
      const timestamp = buildElapsedChartPointTimestamps(
        input.kickoffAt,
        elapsedSeconds,
        nowMs
      );

      return {
        matchId: input.matchId,
        timestamp,
        label: formatChartTimestampClockLabel(timestamp),
        elapsedSeconds,
        primary: input.binary!.primary,
        secondary: input.binary!.secondary
      };
    });

    return {
      chartMode: "binary",
      points: [],
      binaryPoints
    };
  }

  const ternary = input.ternary ?? { home: 33.3, draw: 33.3, away: 33.3 };
  const points = elapsedMarks.map((elapsedSeconds) => {
    const timestamp = buildElapsedChartPointTimestamps(
      input.kickoffAt,
      elapsedSeconds,
      nowMs
    );

    return {
      matchId: input.matchId,
      timestamp,
      label: formatChartTimestampClockLabel(timestamp),
      elapsedSeconds,
      home: ternary.home,
      draw: ternary.draw,
      away: ternary.away
    };
  });

  return {
    chartMode: "ternary",
    points,
    binaryPoints: []
  };
}

export function resolveLiveChartModeFromKind(
  chartKind: FixtureChartKind
): "ternary" | "binary" {
  return chartKind === "total" || chartKind === "spread" ? "binary" : "ternary";
}
