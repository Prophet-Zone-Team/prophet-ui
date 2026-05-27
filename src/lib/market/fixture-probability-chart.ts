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

    if (!previous || previous.label !== point.label) {
      merged.push(point);
      continue;
    }

    merged[merged.length - 1] = {
      ...previous,
      timestamp: point.timestamp,
      home: point.home,
      draw: point.draw,
      away: point.away,
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

    if (!previous || previous.label !== point.label) {
      merged.push(point);
      continue;
    }

    merged[merged.length - 1] = {
      ...previous,
      timestamp: point.timestamp,
      primary: point.primary,
      secondary: point.secondary,
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
