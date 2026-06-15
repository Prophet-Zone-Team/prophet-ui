import {
  buildWinnerChartData,
  filterWinnerChartByRange,
  formatWinnerChartTooltipDate,
  formatWinnerChartXAxisTick,
  type WinnerChartLegendValue,
  type WinnerChartSeriesConfig,
  type WinnerChartTimeRange,
  type WinnerChartYAxisConfig,
  type WinnerProbabilityChartPoint
} from "@/lib/market/winner-probability-chart";
import type {
  ProbabilityHistoryPoint,
  TeamMarketSnapshot
} from "@/types/market";

export type GroupChartTimeRange = WinnerChartTimeRange;

export const GROUP_CHART_TEAM_COUNT = 4;

export const GROUP_CHART_TIME_RANGES: {
  id: GroupChartTimeRange;
  label: string;
}[] = [
  { id: "1H", label: "1H" },
  { id: "1D", label: "1D" },
  { id: "1W", label: "1W" },
  { id: "1M", label: "1M" },
  { id: "all", label: "All" }
];

export type GroupChartSeriesConfig = WinnerChartSeriesConfig;
export type GroupProbabilityChartPoint = WinnerProbabilityChartPoint;
export type GroupChartYAxisConfig = WinnerChartYAxisConfig;
export type GroupChartLegendValue = WinnerChartLegendValue;

function ensureGroupChartPointsComplete(
  points: GroupProbabilityChartPoint[],
  series: GroupChartSeriesConfig[],
  teams: TeamMarketSnapshot[]
): GroupProbabilityChartPoint[] {
  if (points.length === 0 || series.length === 0) {
    return points;
  }

  const fallbackByTeamId = new Map(
    teams.map((snapshot) => [snapshot.team.id, snapshot.market.probability])
  );
  const filledPoints = points.map((point) => ({ ...point }));

  for (const item of series) {
    let lastValue = fallbackByTeamId.get(item.teamId) ?? 0;

    for (const point of filledPoints) {
      const current = point[item.dataKey];

      if (current !== undefined && current !== null) {
        lastValue = Number(current);
        continue;
      }

      point[item.dataKey] = lastValue;
    }
  }

  return filledPoints;
}

export function buildGroupChartData(
  teams: TeamMarketSnapshot[],
  history: ProbabilityHistoryPoint[]
): {
  series: GroupChartSeriesConfig[];
  points: GroupProbabilityChartPoint[];
} {
  const chartTeams = teams.slice(0, GROUP_CHART_TEAM_COUNT);
  const { series, points } = buildWinnerChartData(
    chartTeams,
    history,
    GROUP_CHART_TEAM_COUNT
  );

  return {
    series,
    points: ensureGroupChartPointsComplete(points, series, chartTeams)
  };
}

export function getGroupChartLegendValues(
  series: GroupChartSeriesConfig[],
  teams: TeamMarketSnapshot[]
): GroupChartLegendValue[] {
  const snapshotByTeamId = new Map(
    teams.map((snapshot) => [snapshot.team.id, snapshot])
  );

  return series.map((item) => ({
    teamId: item.teamId,
    teamCode: item.teamCode,
    label: item.label,
    color: item.color,
    dataKey: item.dataKey,
    value: snapshotByTeamId.get(item.teamId)?.market.probability ?? 0
  }));
}

export function filterGroupChartByRange(
  points: GroupProbabilityChartPoint[],
  range: GroupChartTimeRange
): GroupProbabilityChartPoint[] {
  return filterWinnerChartByRange(points, range);
}

export function getGroupChartYDomain(
  points: GroupProbabilityChartPoint[],
  series: GroupChartSeriesConfig[]
): GroupChartYAxisConfig {
  const values = points.flatMap((point) =>
    series.map((item) => Number(point[item.dataKey] ?? 0))
  );

  if (values.length === 0) {
    return { domain: [0, 66], ticks: [0, 20, 40, 60] };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const domainMin = Math.max(0, Math.floor(min / 5) * 5);
  const paddedMax = max * 1.1;
  const domainMax = Math.min(100, Math.ceil(paddedMax / 5) * 5);
  const resolvedMax = Math.max(domainMin + 10, domainMax);
  const tickStep = resolvedMax - domainMin <= 20 ? 5 : 10;
  const ticks: number[] = [];

  for (let tick = domainMin; tick <= resolvedMax; tick += tickStep) {
    ticks.push(tick);
  }

  if (ticks.at(-1) !== resolvedMax) {
    ticks.push(resolvedMax);
  }

  return {
    domain: [domainMin, resolvedMax],
    ticks
  };
}

export function formatGroupChartXAxisTick(
  value: string,
  range: GroupChartTimeRange
): string {
  return formatWinnerChartXAxisTick(value, range);
}

export function formatGroupChartTooltipDate(value: string): string {
  return formatWinnerChartTooltipDate(value);
}
