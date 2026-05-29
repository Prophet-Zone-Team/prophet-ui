import { formatMatchMinuteAxisLabel } from "@/lib/market/match-display";
import { getScheduleRowVariant } from "@/lib/market/schedule-match";
import type { FixtureHistoryInterval } from "@/server/market/clob-prices-history";
import type {
  FixtureChartKind,
  GameFixtureBinaryChartPoint,
  GameFixtureChartPoint,
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

export function resolveEffectiveKickoffAt(
  match: WorldCupMatch,
  nowMs = Date.now()
): string | undefined {
  const isLive = getScheduleRowVariant(match.status) === "ongoing";

  if (match.kickoffAt) {
    const kickoffMs = parseKickoffTimestampMs(match.kickoffAt);

    if (kickoffMs !== undefined && kickoffMs <= nowMs) {
      return new Date(kickoffMs).toISOString();
    }
  }

  if (
    isLive &&
    match.liveElapsedSeconds !== undefined &&
    match.liveElapsedSeconds >= 0
  ) {
    return new Date(nowMs - match.liveElapsedSeconds * 1000).toISOString();
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

export function mapFixturePointsToMatchMinutes(
  points: GameFixtureChartPoint[],
  kickoffAt: string
): GameFixtureChartPoint[] {
  const kickoffMs = parseKickoffTimestampMs(kickoffAt);

  if (kickoffMs === undefined) {
    return [];
  }

  const mapped: GameFixtureChartPoint[] = [];

  for (const point of points) {
    const timestampMs = Date.parse(point.timestamp);

    if (Number.isNaN(timestampMs) || timestampMs < kickoffMs) {
      continue;
    }

    const elapsedSeconds = Math.max(
      0,
      Math.floor((timestampMs - kickoffMs) / 1000)
    );

    mapped.push({
      ...point,
      elapsedSeconds,
      label: formatMatchMinuteAxisLabel(elapsedSeconds)
    });
  }

  return mapped.sort(
    (left, right) => (left.elapsedSeconds ?? 0) - (right.elapsedSeconds ?? 0)
  );
}

export function mapBinaryFixturePointsToMatchMinutes(
  points: GameFixtureBinaryChartPoint[],
  kickoffAt: string
): GameFixtureBinaryChartPoint[] {
  const kickoffMs = parseKickoffTimestampMs(kickoffAt);

  if (kickoffMs === undefined) {
    return [];
  }

  const mapped: GameFixtureBinaryChartPoint[] = [];

  for (const point of points) {
    const timestampMs = Date.parse(point.timestamp);

    if (Number.isNaN(timestampMs) || timestampMs < kickoffMs) {
      continue;
    }

    const elapsedSeconds = Math.max(
      0,
      Math.floor((timestampMs - kickoffMs) / 1000)
    );

    mapped.push({
      ...point,
      elapsedSeconds,
      label: formatMatchMinuteAxisLabel(elapsedSeconds)
    });
  }

  return mapped.sort(
    (left, right) => (left.elapsedSeconds ?? 0) - (right.elapsedSeconds ?? 0)
  );
}

/** Default live chart x-axis spans the first half (0' through 60'). */
export const LIVE_MATCH_CHART_AXIS_MAX_ELAPSED_SECONDS = 60 * 60;

export const LIVE_MATCH_CHART_AXIS_TICK_STEP_SECONDS = 15 * 60;

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

export function resolveLiveChartMaxElapsed(
  kickoffAt: string,
  points: Array<{ elapsedSeconds?: number }> = [],
  nowMs = Date.now()
): number {
  const kickoffElapsed = resolveKickoffElapsedSeconds(kickoffAt, nowMs) ?? 0;
  const pointMax = points.reduce(
    (max, point) => Math.max(max, point.elapsedSeconds ?? 0),
    0
  );

  return Math.max(
    kickoffElapsed,
    pointMax,
    LIVE_MATCH_CHART_AXIS_MAX_ELAPSED_SECONDS
  );
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
    const binaryPoints = elapsedMarks.map((elapsedSeconds) => ({
      matchId: input.matchId,
      timestamp: buildElapsedChartPointTimestamps(
        input.kickoffAt,
        elapsedSeconds,
        nowMs
      ),
      label: formatMatchMinuteAxisLabel(elapsedSeconds),
      elapsedSeconds,
      primary: input.binary!.primary,
      secondary: input.binary!.secondary
    }));

    return {
      chartMode: "binary",
      points: [],
      binaryPoints
    };
  }

  const ternary = input.ternary ?? { home: 33.3, draw: 33.3, away: 33.3 };
  const points = elapsedMarks.map((elapsedSeconds) => ({
    matchId: input.matchId,
    timestamp: buildElapsedChartPointTimestamps(
      input.kickoffAt,
      elapsedSeconds,
      nowMs
    ),
    label: formatMatchMinuteAxisLabel(elapsedSeconds),
    elapsedSeconds,
    home: ternary.home,
    draw: ternary.draw,
    away: ternary.away
  }));

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
