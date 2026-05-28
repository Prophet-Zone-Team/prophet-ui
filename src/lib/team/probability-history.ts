import type { ProbabilityHistoryPoint, TeamMarketSnapshot } from "@/types/market";

export type TeamChartTimeRange = "1H" | "1D" | "1W" | "1M" | "all";

export type TeamChartClobInterval = "1h" | "1d" | "1w" | "1m" | "max" | "all";

/** Default CLOB interval for probability chart requests (team + fixture). */
export const DEFAULT_PROBABILITY_CHART_CLOB_INTERVAL: TeamChartClobInterval = "all";

/** @deprecated Use DEFAULT_PROBABILITY_CHART_CLOB_INTERVAL */
export const DEFAULT_TEAM_PROBABILITY_CHART_INTERVAL =
  DEFAULT_PROBABILITY_CHART_CLOB_INTERVAL;

export interface ClobPriceHistoryInput {
  t: number;
  p: number;
}

/** Unix seconds: end = now, start = 10 days ago. */
export const PROBABILITY_CHART_HISTORY_WINDOW_SECONDS = 10 * 24 * 60 * 60;

export function resolveProbabilityChartTimeWindow(nowMs = Date.now()): {
  startTs: number;
  endTs: number;
} {
  const endTs = Math.floor(nowMs / 1000);
  return {
    endTs,
    startTs: endTs - PROBABILITY_CHART_HISTORY_WINDOW_SECONDS,
  };
}

export function mapTeamChartRangeToClobInterval(
  range: TeamChartTimeRange,
): TeamChartClobInterval {
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

function priceToProbabilityPercent(price: number): number {
  const normalized = price <= 1 ? price * 100 : price;
  return Math.round(Math.max(0.1, Math.min(99.9, normalized)) * 10) / 10;
}

export function buildTeamProbabilityHistoryFromClob(
  teamId: string,
  points: ClobPriceHistoryInput[],
): ProbabilityHistoryPoint[] {
  return [...points]
    .sort((left, right) => left.t - right.t)
    .map((point) => ({
      teamId,
      date: new Date(point.t * 1000).toISOString(),
      probability: priceToProbabilityPercent(point.p),
    }));
}

export const TEAM_CHART_TIME_RANGES: {
  id: TeamChartTimeRange;
  label: string;
}[] = [
  { id: "1H", label: "1H" },
  { id: "1D", label: "1D" },
  { id: "1W", label: "1W" },
  { id: "1M", label: "1M" },
  { id: "all", label: "All" }
];

const RANGE_POINT_LIMIT: Record<Exclude<TeamChartTimeRange, "all">, number> = {
  "1H": 6,
  "1D": 8,
  "1W": 14,
  "1M": 30
};

const ONE_HOUR_CHART_POINT_COUNT = 6;
const ONE_HOUR_CHART_INTERVAL_MS = 10 * 60 * 1000;

/** Pad 1H chart to six points, 10 minutes apart, carrying the latest known price forward. */
export function padTeamChartOneHourSeries(
  data: ProbabilityHistoryPoint[],
  nowMs = Date.now(),
): ProbabilityHistoryPoint[] {
  if (data.length === 0) {
    return data;
  }

  const teamId = data[0]!.teamId;
  const sorted = [...data].sort(
    (left, right) => Date.parse(left.date) - Date.parse(right.date),
  );

  const slotTimes = Array.from(
    { length: ONE_HOUR_CHART_POINT_COUNT },
    (_, index) =>
      nowMs -
      (ONE_HOUR_CHART_POINT_COUNT - 1 - index) * ONE_HOUR_CHART_INTERVAL_MS,
  );

  const resolveProbabilityAt = (timeMs: number): number => {
    let probability = sorted[0]!.probability;

    for (const point of sorted) {
      const pointTime = Date.parse(point.date);

      if (Number.isNaN(pointTime)) {
        continue;
      }

      if (pointTime <= timeMs) {
        probability = point.probability;
      } else {
        break;
      }
    }

    return probability;
  };

  return slotTimes.map((timeMs) => ({
    teamId,
    date: new Date(timeMs).toISOString(),
    probability: resolveProbabilityAt(timeMs),
  }));
}

export function buildFallbackProbabilityHistory(
  snapshot: TeamMarketSnapshot
): ProbabilityHistoryPoint[] {
  const base = snapshot.market.probability;

  return Array.from({ length: 24 }, (_, index) => {
    const offset = index - 23;
    const value =
      base -
      snapshot.market.change7d +
      (snapshot.market.change7d / 23) * index +
      Math.sin(index * 0.4) * 0.4;

    return {
      teamId: snapshot.team.id,
      date:
        offset === 0
          ? new Date().toISOString()
          : new Date(Date.now() + offset * 3_600_000).toISOString(),
      probability: Number(Math.max(0.1, Math.min(99.9, value)).toFixed(1))
    };
  });
}

export function resolveTeamChartData(
  snapshot: TeamMarketSnapshot,
  history: ProbabilityHistoryPoint[]
): ProbabilityHistoryPoint[] {
  if (history.length > 0) {
    return history;
  }

  return buildFallbackProbabilityHistory(snapshot);
}

export function filterTeamChartByRange(
  data: ProbabilityHistoryPoint[],
  range: TeamChartTimeRange,
  nowMs = Date.now(),
): ProbabilityHistoryPoint[] {
  if (range === "all" || data.length === 0) {
    return data;
  }

  const parsed = data.map((point, index) => ({
    point,
    time: Date.parse(point.date),
    index
  }));

  const hasValidTimes = parsed.some((item) => !Number.isNaN(item.time));
  let filtered = data;

  if (hasValidTimes) {
    const rangeMs: Record<Exclude<TeamChartTimeRange, "all">, number> = {
      "1H": 60 * 60 * 1000,
      "1D": 24 * 60 * 60 * 1000,
      "1W": 7 * 24 * 60 * 60 * 1000,
      "1M": 30 * 24 * 60 * 60 * 1000
    };
    const cutoff = nowMs - rangeMs[range];
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
    const limit = RANGE_POINT_LIMIT[range];
    filtered = data.slice(-Math.min(limit, data.length));
  }

  if (range === "1H") {
    return padTeamChartOneHourSeries(filtered, nowMs);
  }

  return filtered;
}

export function formatTeamChartXAxisTick(
  value: string,
  range: TeamChartTimeRange,
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

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function getTeamChartYDomain(
  data: ProbabilityHistoryPoint[]
): [number, number] {
  if (data.length === 0) {
    return [0, 100];
  }

  const values = data.map((point) => point.probability);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max(2, (max - min) * 0.15);

  return [
    Math.max(0, Math.floor(min - padding)),
    Math.min(100, Math.ceil(max + padding))
  ];
}
