import {
  formatDateFromIso,
  formatTimeFromIso,
} from "@/lib/formatters/datetime";
import { buildFallbackProbabilityHistory } from "@/lib/team/probability-history";
import type {
  ProbabilityHistoryPoint,
  TeamMarketSnapshot
} from "@/types/market";

export type WinnerChartTimeRange = "1H" | "1D" | "1W" | "1M" | "all";

export const WINNER_CHART_TIME_RANGES: {
  id: WinnerChartTimeRange;
  label: string;
}[] = [
  { id: "1D", label: "1D" },
  { id: "1W", label: "1W" },
  { id: "1M", label: "1M" },
  { id: "all", label: "All" }
];

const RANGE_MS: Record<Exclude<WinnerChartTimeRange, "all">, number> = {
  "1H": 60 * 60 * 1000,
  "1D": 24 * 60 * 60 * 1000,
  "1W": 7 * 24 * 60 * 60 * 1000,
  "1M": 30 * 24 * 60 * 60 * 1000
};

const WINNER_CHART_PALETTE = [
  "#3168FF",
  "#8AB956",
  "#FF674B",
  "#FDD357",
  "#9B7EDE",
  "#4ECDC4",
  "#E879A9",
  "#FF9500"
] as const;

const DEFAULT_TOP_TEAM_COUNT = 8;

export interface WinnerChartSeriesConfig {
  teamId: string;
  teamCode: string;
  label: string;
  color: string;
  dataKey: string;
}

export interface WinnerProbabilityChartPoint {
  date: string;
  [dataKey: string]: string | number;
}

export interface WinnerChartYAxisConfig {
  domain: [number, number];
  ticks: number[];
}

export interface WinnerChartLegendValue {
  teamId: string;
  teamCode: string;
  label: string;
  color: string;
  dataKey: string;
  value: number;
}

export interface WinnerChartData {
  series: WinnerChartSeriesConfig[];
  points: WinnerProbabilityChartPoint[];
}

export function buildWinnerChartData(
  teams: TeamMarketSnapshot[],
  history: ProbabilityHistoryPoint[],
  topCount = DEFAULT_TOP_TEAM_COUNT
): WinnerChartData {
  const series = buildWinnerChartSeries(teams, topCount);
  const teamIds = series.map((item) => item.teamId);
  const points = pivotProbabilityHistory(history, teamIds);

  if (points.length > 0) {
    return { series, points };
  }

  return {
    series,
    points: buildFallbackWinnerChartPoints(teams.slice(0, topCount), series)
  };
}

export function buildWinnerChartSeries(
  teams: TeamMarketSnapshot[],
  topCount = DEFAULT_TOP_TEAM_COUNT
): WinnerChartSeriesConfig[] {
  return teams.slice(0, topCount).map((snapshot, index) => ({
    teamId: snapshot.team.id,
    teamCode: snapshot.team.code,
    label: snapshot.team.name,
    color: WINNER_CHART_PALETTE[index % WINNER_CHART_PALETTE.length],
    dataKey: snapshot.team.id
  }));
}

function pivotProbabilityHistory(
  history: ProbabilityHistoryPoint[],
  teamIds: string[]
): WinnerProbabilityChartPoint[] {
  if (history.length === 0 || teamIds.length === 0) {
    return [];
  }

  const teamIdSet = new Set(teamIds);
  const historyByTeam = new Map<string, ProbabilityHistoryPoint[]>();

  for (const point of history) {
    if (!teamIdSet.has(point.teamId)) {
      continue;
    }

    const teamHistory = historyByTeam.get(point.teamId) ?? [];
    teamHistory.push(point);
    historyByTeam.set(point.teamId, teamHistory);
  }

  for (const [teamId, teamHistory] of historyByTeam) {
    historyByTeam.set(
      teamId,
      teamHistory.sort(
        (left, right) => Date.parse(left.date) - Date.parse(right.date)
      )
    );
  }

  const timestampSet = new Set<number>();

  for (const point of history) {
    if (!teamIdSet.has(point.teamId)) {
      continue;
    }

    const timeMs = Date.parse(point.date);

    if (!Number.isNaN(timeMs)) {
      timestampSet.add(timeMs);
    }
  }

  const sortedTimestamps = Array.from(timestampSet).sort(
    (left, right) => left - right
  );

  return sortedTimestamps.map((timeMs) => {
    const row: WinnerProbabilityChartPoint = {
      date: new Date(timeMs).toISOString()
    };

    for (const teamId of teamIds) {
      const teamHistory = historyByTeam.get(teamId);

      if (!teamHistory?.length) {
        continue;
      }

      let probability: number | undefined;

      for (const point of teamHistory) {
        const pointTimeMs = Date.parse(point.date);

        if (Number.isNaN(pointTimeMs)) {
          continue;
        }

        if (pointTimeMs <= timeMs) {
          probability = point.probability;
        } else {
          break;
        }
      }

      if (probability !== undefined) {
        row[teamId] = probability;
      }
    }

    return row;
  });
}

function buildFallbackWinnerChartPoints(
  teams: TeamMarketSnapshot[],
  series: WinnerChartSeriesConfig[]
): WinnerProbabilityChartPoint[] {
  const histories = teams.map((snapshot) => ({
    teamId: snapshot.team.id,
    points: buildFallbackProbabilityHistory(snapshot)
  }));

  const maxLength = Math.max(...histories.map((item) => item.points.length), 0);

  return Array.from({ length: maxLength }, (_, index) => {
    const point: WinnerProbabilityChartPoint = {
      date: histories[0]?.points[index]?.date ?? new Date().toISOString()
    };

    for (const item of histories) {
      const value = item.points[index]?.probability;

      if (value !== undefined) {
        point[item.teamId] = value;
      }
    }

    for (const item of series) {
      if (point[item.dataKey] === undefined) {
        point[item.dataKey] = 0;
      }
    }

    return point;
  });
}

export function filterWinnerChartByRange(
  points: WinnerProbabilityChartPoint[],
  range: WinnerChartTimeRange
): WinnerProbabilityChartPoint[] {
  if (points.length === 0 || range === "all") {
    return points;
  }

  const latest = new Date(points.at(-1)?.date ?? Date.now()).getTime();
  const cutoff = latest - RANGE_MS[range];

  const filtered = points.filter((point) => new Date(point.date).getTime() >= cutoff);

  return filtered.length > 1 ? filtered : points.slice(-2);
}

export function getWinnerChartYDomain(
  points: WinnerProbabilityChartPoint[],
  series: WinnerChartSeriesConfig[]
): WinnerChartYAxisConfig {
  const values = points.flatMap((point) =>
    series.map((item) => Number(point[item.dataKey] ?? 0))
  );

  if (values.length === 0) {
    return { domain: [10, 18], ticks: [10, 12, 14, 16, 18] };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const paddedMin = Math.floor((min - 1) / 2) * 2;
  const paddedMax = Math.ceil((max + 1) / 2) * 2;
  const domainMin = Math.max(0, paddedMin);
  const domainMax = Math.max(domainMin + 4, paddedMax);
  const ticks: number[] = [];

  for (let tick = domainMin; tick <= domainMax; tick += 2) {
    ticks.push(tick);
  }

  return {
    domain: [domainMin, domainMax],
    ticks
  };
}

export function getLatestSeriesValues(
  points: WinnerProbabilityChartPoint[],
  series: WinnerChartSeriesConfig[]
): WinnerChartLegendValue[] {
  const latest = points.at(-1);

  if (!latest) {
    return series.map((item) => ({
      teamId: item.teamId,
      teamCode: item.teamCode,
      label: item.label,
      color: item.color,
      dataKey: item.dataKey,
      value: 0
    }));
  }

  return series.map((item) => ({
    teamId: item.teamId,
    teamCode: item.teamCode,
    label: item.label,
    color: item.color,
    dataKey: item.dataKey,
    value: Number(latest[item.dataKey] ?? 0)
  }));
}

export function formatWinnerChartXAxisTick(
  value: string,
  range: WinnerChartTimeRange
): string {
  if (range === "1H" || range === "1D") {
    return formatTimeFromIso(value);
  }

  return formatDateFromIso(value);
}

export function formatWinnerChartTooltipDate(value: string): string {
  return formatDateFromIso(value);
}
