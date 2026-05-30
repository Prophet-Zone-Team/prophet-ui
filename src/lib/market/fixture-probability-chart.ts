import { PROBABILITY_CHART_HISTORY_WINDOW_SECONDS } from "@/lib/team/probability-history";
import type { FixtureHistoryInterval } from "@/server/market/clob-prices-history";
import type {
  GameFixtureBinaryChartPoint,
  GameFixtureChartPoint,
  GameFixtureChartTimeRange,
  MatchOutcomeSide,
} from "@/types/market";

export interface FixtureOutcomeHistoryInput {
  side: MatchOutcomeSide;
  tokenId: string;
  history: Array<{ t: number; p: number }>;
}

export interface FixtureBinaryOutcomeHistoryInput {
  key: "primary" | "secondary";
  tokenId: string;
  history: Array<{ t: number; p: number }>;
}

const OUTCOME_SIDES: MatchOutcomeSide[] = ["home", "draw", "away"];

const chartDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export function mapUiRangeToClobInterval(
  range: GameFixtureChartTimeRange,
): FixtureHistoryInterval {
  switch (range) {
    case "1H":
      return "1h";
    case "1D":
      return "1d";
    case "1W":
      return "1w";
    case "1M":
      return "1m";
    case "all":
      return "max";
  }
}

const GAME_RANGE_POINT_LIMIT: Record<
  Exclude<GameFixtureChartTimeRange, "all">,
  number
> = {
  "1H": 6,
  "1D": 8,
  "1W": 14,
  "1M": 30,
};

const GAME_CHART_RANGE_MS: Record<
  Exclude<GameFixtureChartTimeRange, "all">,
  number
> = {
  "1H": 60 * 60 * 1000,
  "1D": 24 * 60 * 60 * 1000,
  "1W": 7 * 24 * 60 * 60 * 1000,
  "1M": 30 * 24 * 60 * 60 * 1000,
};

const ONE_HOUR_CHART_POINT_COUNT = 6;
const ONE_HOUR_CHART_INTERVAL_MS = 10 * 60 * 1000;

const ALL_CHART_POINT_COUNT = 30;
const ALL_CHART_RANGE_MS = PROBABILITY_CHART_HISTORY_WINDOW_SECONDS * 1000;

export function resolveGameChartRangePadding(
  range: GameFixtureChartTimeRange,
): { pointCount: number; intervalMs: number } {
  if (range === "1H") {
    return {
      pointCount: ONE_HOUR_CHART_POINT_COUNT,
      intervalMs: ONE_HOUR_CHART_INTERVAL_MS,
    };
  }

  if (range === "all") {
    return {
      pointCount: ALL_CHART_POINT_COUNT,
      intervalMs: ALL_CHART_RANGE_MS / (ALL_CHART_POINT_COUNT - 1),
    };
  }

  const pointCount = GAME_RANGE_POINT_LIMIT[range];
  const rangeMs = GAME_CHART_RANGE_MS[range];

  return {
    pointCount,
    intervalMs: rangeMs / (pointCount - 1),
  };
}

export function formatGameChartXAxisTick(
  value: string,
  range: GameFixtureChartTimeRange,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  if (range === "1H" || range === "1D") {
    return new Intl.DateTimeFormat("en", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  }

  return chartDateFormatter.format(date);
}

export function filterGameFixtureChartByRange(
  data: GameFixtureChartPoint[],
  range: GameFixtureChartTimeRange,
  nowMs = Date.now(),
): GameFixtureChartPoint[] {
  if (data.length === 0) {
    return data;
  }

  const parsed = data.map((point, index) => ({
    point,
    time: Date.parse(point.timestamp),
    index,
  }));

  const hasValidTimes = parsed.some((item) => !Number.isNaN(item.time));
  let filtered = data;

  if (range === "all") {
    if (!hasValidTimes) {
      filtered = data.slice(-Math.min(ALL_CHART_POINT_COUNT, data.length));
    }
  } else if (hasValidTimes) {
    const cutoff = nowMs - GAME_CHART_RANGE_MS[range];
    const inRange = parsed.filter(
      (item) => !Number.isNaN(item.time) && item.time >= cutoff,
    );

    if (inRange.length > 0) {
      filtered = inRange.map((item) => item.point);
    } else {
      const latest = parsed
        .filter((item) => !Number.isNaN(item.time))
        .sort((left, right) => left.time - right.time)
        .at(-1);

      filtered = latest ? [latest.point] : data;
    }
  } else {
    const limit = GAME_RANGE_POINT_LIMIT[range];
    filtered = data.slice(-Math.min(limit, data.length));
  }

  const { pointCount, intervalMs } = resolveGameChartRangePadding(range);
  return padGameFixtureTernarySeries(filtered, pointCount, intervalMs, nowMs);
}

export function filterGameBinaryFixtureChartByRange(
  data: GameFixtureBinaryChartPoint[],
  range: GameFixtureChartTimeRange,
  nowMs = Date.now(),
): GameFixtureBinaryChartPoint[] {
  if (data.length === 0) {
    return data;
  }

  const parsed = data.map((point, index) => ({
    point,
    time: Date.parse(point.timestamp),
    index,
  }));

  const hasValidTimes = parsed.some((item) => !Number.isNaN(item.time));
  let filtered = data;

  if (range === "all") {
    if (!hasValidTimes) {
      filtered = data.slice(-Math.min(ALL_CHART_POINT_COUNT, data.length));
    }
  } else if (hasValidTimes) {
    const cutoff = nowMs - GAME_CHART_RANGE_MS[range];
    const inRange = parsed.filter(
      (item) => !Number.isNaN(item.time) && item.time >= cutoff,
    );

    if (inRange.length > 0) {
      filtered = inRange.map((item) => item.point);
    } else {
      const latest = parsed
        .filter((item) => !Number.isNaN(item.time))
        .sort((left, right) => left.time - right.time)
        .at(-1);

      filtered = latest ? [latest.point] : data;
    }
  } else {
    const limit = GAME_RANGE_POINT_LIMIT[range];
    filtered = data.slice(-Math.min(limit, data.length));
  }

  const { pointCount, intervalMs } = resolveGameChartRangePadding(range);
  return padGameFixtureBinarySeries(filtered, pointCount, intervalMs, nowMs);
}

export function padGameFixtureTernarySeries(
  data: GameFixtureChartPoint[],
  pointCount: number,
  intervalMs: number,
  nowMs = Date.now(),
): GameFixtureChartPoint[] {
  if (data.length === 0 || pointCount < 2) {
    return data;
  }

  const matchId = data[0]!.matchId;
  const sorted = [...data].sort(
    (left, right) => Date.parse(left.timestamp) - Date.parse(right.timestamp),
  );

  const slotTimes = Array.from(
    { length: pointCount },
    (_, index) => nowMs - (pointCount - 1 - index) * intervalMs,
  );

  const resolveValuesAt = (timeMs: number) => {
    let home = sorted[0]!.home;
    let draw = sorted[0]!.draw;
    let away = sorted[0]!.away;

    for (const point of sorted) {
      const pointTime = Date.parse(point.timestamp);

      if (Number.isNaN(pointTime)) {
        continue;
      }

      if (pointTime <= timeMs) {
        home = point.home;
        draw = point.draw;
        away = point.away;
      } else {
        break;
      }
    }

    return { home, draw, away };
  };

  return slotTimes.map((timeMs) => {
    const values = resolveValuesAt(timeMs);

    return {
      matchId,
      timestamp: new Date(timeMs).toISOString(),
      label: formatFixtureChartLabel(timeMs),
      home: values.home,
      draw: values.draw,
      away: values.away,
    };
  });
}

export function padGameFixtureTernaryOneHourSeries(
  data: GameFixtureChartPoint[],
  nowMs = Date.now(),
): GameFixtureChartPoint[] {
  const { pointCount, intervalMs } = resolveGameChartRangePadding("1H");
  return padGameFixtureTernarySeries(data, pointCount, intervalMs, nowMs);
}

export function padGameFixtureBinarySeries(
  data: GameFixtureBinaryChartPoint[],
  pointCount: number,
  intervalMs: number,
  nowMs = Date.now(),
): GameFixtureBinaryChartPoint[] {
  if (data.length === 0 || pointCount < 2) {
    return data;
  }

  const matchId = data[0]!.matchId;
  const sorted = [...data].sort(
    (left, right) => Date.parse(left.timestamp) - Date.parse(right.timestamp),
  );

  const slotTimes = Array.from(
    { length: pointCount },
    (_, index) => nowMs - (pointCount - 1 - index) * intervalMs,
  );

  const resolveValuesAt = (timeMs: number) => {
    let primary = sorted[0]!.primary;
    let secondary = sorted[0]!.secondary;

    for (const point of sorted) {
      const pointTime = Date.parse(point.timestamp);

      if (Number.isNaN(pointTime)) {
        continue;
      }

      if (pointTime <= timeMs) {
        primary = point.primary;
        secondary = point.secondary;
      } else {
        break;
      }
    }

    return { primary, secondary };
  };

  return slotTimes.map((timeMs) => {
    const values = resolveValuesAt(timeMs);

    return {
      matchId,
      timestamp: new Date(timeMs).toISOString(),
      label: formatFixtureChartLabel(timeMs),
      primary: values.primary,
      secondary: values.secondary,
    };
  });
}

export function padGameFixtureBinaryOneHourSeries(
  data: GameFixtureBinaryChartPoint[],
  nowMs = Date.now(),
): GameFixtureBinaryChartPoint[] {
  const { pointCount, intervalMs } = resolveGameChartRangePadding("1H");
  return padGameFixtureBinarySeries(data, pointCount, intervalMs, nowMs);
}

function priceToProbabilityPercent(price: number): number {
  const normalized = price <= 1 ? price * 100 : price;
  return Math.round(Math.max(0.1, Math.min(99.9, normalized)) * 10) / 10;
}

function formatFixtureChartLabel(timestampMs: number): string {
  return chartDateFormatter.format(new Date(timestampMs));
}

export function buildFixtureChartPoints(
  matchId: string,
  outcomes: FixtureOutcomeHistoryInput[],
): GameFixtureChartPoint[] {
  const historiesBySide = new Map<MatchOutcomeSide, Array<{ t: number; p: number }>>();

  for (const outcome of outcomes) {
    historiesBySide.set(
      outcome.side,
      [...outcome.history].sort((left, right) => left.t - right.t),
    );
  }

  const timestamps = [
    ...new Set(
      outcomes.flatMap((outcome) => outcome.history.map((point) => point.t * 1000)),
    ),
  ].sort((left, right) => left - right);

  if (timestamps.length === 0) {
    return [];
  }

  const latestBySide: Partial<Record<MatchOutcomeSide, number>> = {};
  const indexesBySide = new Map<MatchOutcomeSide, number>(
    OUTCOME_SIDES.map((side) => [side, 0]),
  );
  const points: GameFixtureChartPoint[] = [];

  for (const timestampMs of timestamps) {
    const timestampSeconds = Math.floor(timestampMs / 1000);

    for (const side of OUTCOME_SIDES) {
      const history = historiesBySide.get(side) ?? [];
      let pointIndex = indexesBySide.get(side) ?? 0;

      while (pointIndex < history.length && history[pointIndex]!.t <= timestampSeconds) {
        latestBySide[side] = priceToProbabilityPercent(history[pointIndex]!.p);
        pointIndex += 1;
      }

      indexesBySide.set(side, pointIndex);
    }

    if (
      latestBySide.home === undefined ||
      latestBySide.draw === undefined ||
      latestBySide.away === undefined
    ) {
      continue;
    }

    points.push({
      matchId,
      timestamp: new Date(timestampMs).toISOString(),
      label: formatFixtureChartLabel(timestampMs),
      home: latestBySide.home,
      draw: latestBySide.draw,
      away: latestBySide.away,
    });
  }

  return mergeFixtureChartPoints(points);
}

function mergeFixtureChartPoints(points: GameFixtureChartPoint[]): GameFixtureChartPoint[] {
  const merged: GameFixtureChartPoint[] = [];

  for (const point of points) {
    const previous = merged.at(-1);

    if (!previous || previous.timestamp !== point.timestamp) {
      merged.push(point);
      continue;
    }

    merged[merged.length - 1] = {
      ...previous,
      label: point.label,
      home: point.home,
      draw: point.draw,
      away: point.away
    };
  }

  return merged;
}

export function getFixtureChartYDomain(
  points: GameFixtureChartPoint[],
): [number, number] {
  if (points.length === 0) {
    return [0, 100];
  }

  const values = points.flatMap((point) => [point.home, point.draw, point.away]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max(2, (max - min) * 0.2);
  const lower = Math.max(0, Math.floor((min - padding) / 5) * 5);
  const upper = Math.min(100, Math.ceil((max + padding) / 5) * 5);

  return [lower, Math.max(lower + 10, upper)];
}

export function getLatestFixtureChartValues(points: GameFixtureChartPoint[]): {
  home: number;
  draw: number;
  away: number;
} {
  const latest = points.at(-1);

  return {
    home: latest?.home ?? 0,
    draw: latest?.draw ?? 0,
    away: latest?.away ?? 0,
  };
}

export function buildBinaryFixtureChartPoints(
  matchId: string,
  outcomes: FixtureBinaryOutcomeHistoryInput[],
): GameFixtureBinaryChartPoint[] {
  const historiesByKey = new Map<
    "primary" | "secondary",
    Array<{ t: number; p: number }>
  >();

  for (const outcome of outcomes) {
    historiesByKey.set(outcome.key, [...outcome.history].sort((a, b) => a.t - b.t));
  }

  const timestamps = [
    ...new Set(
      outcomes.flatMap((outcome) => outcome.history.map((point) => point.t * 1000)),
    ),
  ].sort((left, right) => left - right);

  if (timestamps.length === 0) {
    return [];
  }

  const latestByKey: Partial<Record<"primary" | "secondary", number>> = {};
  const indexesByKey = new Map<"primary" | "secondary", number>([
    ["primary", 0],
    ["secondary", 0],
  ]);
  const points: GameFixtureBinaryChartPoint[] = [];

  for (const timestampMs of timestamps) {
    const timestampSeconds = Math.floor(timestampMs / 1000);

    for (const key of ["primary", "secondary"] as const) {
      const history = historiesByKey.get(key) ?? [];
      let pointIndex = indexesByKey.get(key) ?? 0;

      while (pointIndex < history.length && history[pointIndex]!.t <= timestampSeconds) {
        latestByKey[key] = priceToProbabilityPercent(history[pointIndex]!.p);
        pointIndex += 1;
      }

      indexesByKey.set(key, pointIndex);
    }

    if (latestByKey.primary === undefined || latestByKey.secondary === undefined) {
      continue;
    }

    points.push({
      matchId,
      timestamp: new Date(timestampMs).toISOString(),
      label: formatFixtureChartLabel(timestampMs),
      primary: latestByKey.primary,
      secondary: latestByKey.secondary,
    });
  }

  return mergeBinaryFixtureChartPoints(points);
}

function mergeBinaryFixtureChartPoints(
  points: GameFixtureBinaryChartPoint[],
): GameFixtureBinaryChartPoint[] {
  const merged: GameFixtureBinaryChartPoint[] = [];

  for (const point of points) {
    const previous = merged.at(-1);

    if (!previous || previous.timestamp !== point.timestamp) {
      merged.push(point);
      continue;
    }

    merged[merged.length - 1] = {
      ...previous,
      label: point.label,
      primary: point.primary,
      secondary: point.secondary
    };
  }

  return merged;
}

export function getBinaryFixtureChartYDomain(
  points: GameFixtureBinaryChartPoint[],
): [number, number] {
  if (points.length === 0) {
    return [0, 100];
  }

  const values = points.flatMap((point) => [point.primary, point.secondary]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max(2, (max - min) * 0.2);
  const lower = Math.max(0, Math.floor((min - padding) / 5) * 5);
  const upper = Math.min(100, Math.ceil((max + padding) / 5) * 5);

  return [lower, Math.max(lower + 10, upper)];
}

export function getLatestBinaryFixtureChartValues(
  points: GameFixtureBinaryChartPoint[],
): { primary: number; secondary: number } {
  const latest = points.at(-1);

  return {
    primary: latest?.primary ?? 0,
    secondary: latest?.secondary ?? 0,
  };
}
