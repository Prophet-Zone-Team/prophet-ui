import type { ProbabilityHistoryPoint, TeamMarketSnapshot } from "@/types/market";

export type TeamChartTimeRange = "1H" | "1D" | "1W" | "1M" | "all";

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
  "1H": 4,
  "1D": 8,
  "1W": 14,
  "1M": 30
};

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
  range: TeamChartTimeRange
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

  if (hasValidTimes) {
    const now = Date.now();
    const rangeMs: Record<Exclude<TeamChartTimeRange, "all">, number> = {
      "1H": 60 * 60 * 1000,
      "1D": 24 * 60 * 60 * 1000,
      "1W": 7 * 24 * 60 * 60 * 1000,
      "1M": 30 * 24 * 60 * 60 * 1000
    };
    const cutoff = now - rangeMs[range];
    const filtered = parsed.filter((item) => !Number.isNaN(item.time) && item.time >= cutoff);

    if (filtered.length > 0) {
      return filtered.map((item) => item.point);
    }
  }

  const limit = RANGE_POINT_LIMIT[range];
  return data.slice(-Math.min(limit, data.length));
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
