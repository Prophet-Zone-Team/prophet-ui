"use client";

import { useMemo, useState, type ReactElement } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps
} from "recharts";
import { useTranslations } from "next-intl";

import { formatProbability } from "@/components/home/market-formatters";
import { TeamFlag } from "@/components/teams/team-flag";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { useProbabilityChart } from "@/hooks/market/use-probability-chart";
import { cn } from "@/lib/cn";
import {
  buildGroupChartData,
  filterGroupChartByRange,
  formatGroupChartTooltipDate,
  formatGroupChartXAxisTick,
  getGroupChartLegendValues,
  getGroupChartYDomain,
  GROUP_CHART_TEAM_COUNT,
  GROUP_CHART_TIME_RANGES,
  type GroupChartLegendValue,
  type GroupChartSeriesConfig,
  type GroupChartTimeRange
} from "@/lib/market/group-probability-chart";
import { useDarkModeEnabled } from "@/store";
import type { TeamMarketSnapshot } from "@/types/market";

export interface GroupProbabilityChartProps {
  className?: string;
  teams: TeamMarketSnapshot[];
}

function renderEndFlag(
  dataLength: number,
  teamCode: string,
  teamName: string
): (props: {
  cx?: number;
  cy?: number;
  index?: number;
}) => ReactElement<SVGElement> {
  return function EndFlag({ cx, cy, index }) {
    if (index !== dataLength - 1 || cx === undefined || cy === undefined) {
      return <g />;
    }

    const flagSize = 16;

    return (
      <foreignObject
        x={cx - flagSize / 2}
        y={cy - flagSize / 2}
        width={flagSize}
        height={flagSize}
        className="overflow-visible"
      >
        <div className="flex h-full w-full items-center justify-center">
          <TeamFlag
            code={teamCode}
            name={teamName}
            className="!h-4 !w-4 rounded-[2px]"
          />
        </div>
      </foreignObject>
    );
  };
}

export function GroupProbabilityChart({
  className,
  teams
}: GroupProbabilityChartProps) {
  const t = useTranslations("trade");
  const tHome = useTranslations("home");
  const darkModeEnabled = useDarkModeEnabled();
  const chartMutedColor = darkModeEnabled ? "#666668" : "#909090";
  const chartCursorColor = darkModeEnabled ? "#353535" : "#EBEBEB";
  const [timeRange, setTimeRange] = useState<GroupChartTimeRange>("all");

  const { points: fetchedPoints, status: fetchStatus } = useProbabilityChart({
    kind: "winner",
    teams,
    topCount: GROUP_CHART_TEAM_COUNT,
    pollIntervalMs: 5000
  });

  const effectiveHistory = fetchStatus === "ready" ? fetchedPoints : [];

  const { series, points } = useMemo(
    () => buildGroupChartData(teams, effectiveHistory),
    [teams, effectiveHistory]
  );

  const chartData = useMemo(
    () => filterGroupChartByRange(points, timeRange),
    [points, timeRange]
  );

  const yAxis = useMemo(
    () => getGroupChartYDomain(chartData, series),
    [chartData, series]
  );

  const formatXAxisTick = (value: string) =>
    formatGroupChartXAxisTick(value, timeRange);

  const chartTimeRanges = useMemo(
    () =>
      GROUP_CHART_TIME_RANGES.map((range) => ({
        ...range,
        label: range.id === "all" ? t("chartRangeAll") : range.label
      })),
    [t]
  );

  const legendValues = useMemo(
    () =>
      getGroupChartLegendValues(series, teams.slice(0, GROUP_CHART_TEAM_COUNT)),
    [series, teams]
  );

  const showChart = fetchStatus === "ready";

  return (
    <section
      className={cn(
        "min-w-0 rounded-xl border border-prophet-line bg-prophet-panel px-4 pb-4 pt-3",
        className
      )}
      aria-label={t("groupWinnerProbabilityChartAria")}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="m-0 text-base font-[500] leading-6 text-prophet-foreground md:text-[20px]">
          {t("groupWinnerProbability")}
        </h2>

        <div
          className="flex flex-wrap gap-4"
          role="group"
          aria-label={t("chartTimeRangeAria")}
        >
          {chartTimeRanges.map((range) => (
            <button
              key={range.id}
              type="button"
              className={cn(
                "border-0 bg-transparent p-0 text-[10px] leading-[12px]",
                timeRange === range.id
                  ? "font-[500] text-prophet-foreground"
                  : "font-[400] text-prophet-muted"
              )}
              onClick={() => setTimeRange(range.id)}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {!showChart && fetchStatus === "loading" ? (
        <p className="mt-4 py-8 text-center text-sm text-prophet-muted">
          {tHome("loadingProbabilityHistory")}
        </p>
      ) : !showChart && fetchStatus === "error" ? (
        <p className="mt-4 py-8 text-center text-sm text-prophet-muted">
          {tHome("unableToLoadProbabilityHistory")}
        </p>
      ) : !showChart && fetchStatus === "empty" ? (
        <p className="mt-4 py-8 text-center text-sm text-prophet-muted">
          {tHome("marketTokenUnavailable")}
        </p>
      ) : (
        <>
          <GroupChartLegend items={legendValues} className="mt-3" />

          <div className="mt-4 h-[190px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 56, left: 8, bottom: 8 }}
              >
                <XAxis
                  dataKey="date"
                  padding={{ left: 0, right: 12 }}
                  tick={{
                    fill: chartMutedColor,
                    fontSize: 10,
                    dy: 6
                  }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={32}
                  tickFormatter={formatXAxisTick}
                />
                <YAxis
                  orientation="right"
                  domain={yAxis.domain}
                  ticks={yAxis.ticks}
                  tick={{ fill: chartMutedColor, fontSize: 10 }}
                  tickFormatter={(value: number) => `${value}%`}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                />
                <Tooltip
                  cursor={{ stroke: chartCursorColor, strokeWidth: 1 }}
                  content={<GroupChartTooltip series={series} />}
                />
                {series.map((item) => (
                  <Line
                    key={item.dataKey}
                    type="monotone"
                    dataKey={item.dataKey}
                    stroke={item.color}
                    strokeWidth={1}
                    dot={renderEndFlag(
                      chartData.length,
                      item.teamCode,
                      item.label
                    )}
                    activeDot={{
                      r: 5,
                      fill: item.color,
                      stroke: item.color,
                      strokeWidth: 1
                    }}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </section>
  );
}

function GroupChartLegend({
  items,
  className
}: {
  items: GroupChartLegendValue[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex max-w-full flex-wrap items-center gap-x-6 gap-y-2 rounded-lg px-3 py-2",
        className
      )}
    >
      {items.map((item) => (
        <GroupChartLegendItem key={item.teamId} item={item} />
      ))}
    </div>
  );
}

function GroupChartLegendItem({ item }: { item: GroupChartLegendValue }) {
  const teamDisplayName = useLocalizedTeamName(item.teamCode, item.label);

  return (
    <div className="flex items-center gap-2 text-[10px] leading-[12px]">
      <span
        className="h-3 w-3 shrink-0 rounded-full"
        style={{ backgroundColor: item.color }}
        aria-hidden="true"
      />
      <span className="text-prophet-muted">{teamDisplayName}</span>
      <span className="font-[500] text-prophet-foreground">
        {formatProbability(item.value)}
      </span>
    </div>
  );
}

function GroupChartTooltip({
  active,
  payload,
  label,
  series
}: TooltipProps<number, string> & {
  series: GroupChartSeriesConfig[];
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const dateLabel = typeof label === "string" ? label : String(label ?? "");

  return (
    <div className="rounded-xl border border-prophet-line bg-prophet-panel px-3 py-2 shadow-[0_0_10px_rgba(0,0,0,0.1)]">
      <p className="m-0 mb-1 text-[10px] font-[400] leading-[12px] text-prophet-muted">
        {formatGroupChartTooltipDate(dateLabel)}
      </p>
      {payload.map((entry) => {
        const item = series.find(
          (seriesItem) => seriesItem.dataKey === entry.dataKey
        );

        return (
          <GroupChartTooltipRow
            key={String(entry.dataKey)}
            teamCode={item?.teamCode}
            fallbackLabel={item?.label ?? String(entry.dataKey)}
            color={entry.color}
            value={
              typeof entry.value === "number"
                ? formatProbability(entry.value)
                : "—"
            }
          />
        );
      })}
    </div>
  );
}

function GroupChartTooltipRow({
  teamCode,
  fallbackLabel,
  color,
  value
}: {
  teamCode?: string;
  fallbackLabel: string;
  color?: string;
  value: string;
}) {
  const teamDisplayName = useLocalizedTeamName(teamCode, fallbackLabel);

  return (
    <p className="m-0 text-[10px] font-[400] leading-[12px]" style={{ color }}>
      {teamDisplayName}: {value}
    </p>
  );
}
