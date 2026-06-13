"use client";

import { useMemo, useState, type ReactElement } from "react";

import { useAnalyticsImpression } from "@/hooks/analytics/use-analytics-impression";
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

import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";

import { formatProbability } from "@/components/home/market-formatters";
import { useProbabilityChart } from "@/hooks/market/use-probability-chart";
import { cn } from "@/lib/cn";
import {
  buildWinnerChartData,
  filterWinnerChartByRange,
  formatWinnerChartTooltipDate,
  formatWinnerChartXAxisTick,
  getLatestSeriesValues,
  getWinnerChartYDomain,
  type WinnerChartSeriesConfig,
  type WinnerChartTimeRange
} from "@/lib/market/winner-probability-chart";
import type {
  ProbabilityHistoryPoint,
  TeamMarketSnapshot
} from "@/types/market";

export interface WinnerProbabilityChartProps {
  className?: string;
  teams: TeamMarketSnapshot[];
  probabilityHistory?: ProbabilityHistoryPoint[];
  /** When true, omit the built-in section title (e.g. parent panel provides the heading). */
  hideTitle?: boolean;
  topTeamCount?: number;
  /** When true, show x-axis labels and hover tooltip (e.g. team detail panel). */
  showAxisTooltip?: boolean;
}

function renderEndDot(
  dataLength: number,
  color: string
): (props: {
  cx?: number;
  cy?: number;
  index?: number;
}) => ReactElement<SVGElement> {
  return function EndDot({ cx, cy, index }) {
    if (index !== dataLength - 1 || cx === undefined || cy === undefined) {
      return <g />;
    }

    return <circle cx={cx} cy={cy} r={6} fill={color} stroke={color} />;
  };
}

export function WinnerProbabilityChart({
  className,
  teams,
  probabilityHistory,
  hideTitle = false,
  topTeamCount = 8,
  showAxisTooltip = false
}: WinnerProbabilityChartProps) {
  const t = useTranslations("home");
  const [timeRange, setTimeRange] = useState<WinnerChartTimeRange>("all");
  const shouldFetch = probabilityHistory === undefined;

  const {
    points: fetchedPoints,
    status: fetchStatus
  } = useProbabilityChart({
    kind: "winner",
    teams,
    topCount: topTeamCount,
    pollIntervalMs: 5000,
    enabled: shouldFetch
  });

  const formatXAxisTick = (value: string) =>
    formatWinnerChartXAxisTick(value, timeRange);

  const effectiveHistory = shouldFetch
    ? fetchStatus === "ready"
      ? fetchedPoints
      : []
    : probabilityHistory;

  const { series, points } = useMemo(
    () => buildWinnerChartData(teams, effectiveHistory, topTeamCount),
    [teams, effectiveHistory, topTeamCount]
  );

  const chartData = useMemo(
    () => filterWinnerChartByRange(points, timeRange),
    [points, timeRange]
  );

  const yAxis = useMemo(
    () => getWinnerChartYDomain(chartData, series),
    [chartData, series]
  );

  const legendValues = useMemo(
    () => getLatestSeriesValues(chartData, series),
    [chartData, series]
  );

  const showChart = !shouldFetch || fetchStatus === "ready";
  const chartRef = useAnalyticsImpression<HTMLElement>({
    eventName: "chart_viewed",
    dedupeKey: "chart:winner_probability",
    enabled: showChart,
    payload: {
      chartId: "winner_probability",
      section: "winner_chart"
    }
  });

  return (
    <section
      ref={chartRef}
      className={cn(
        "min-w-0 rounded-xl border border-[#EBEBEB] bg-white px-3 md:px-5 pb-5 pt-4",
        className
      )}
      aria-label={t("worldCupWinnerProbabilityChartAria")}
    >
      <div
        className={cn(
          "flex flex-wrap items-center md:items-start flex-col md:flex-row justify-between gap-3",
          hideTitle ? "pr-0" : "pr-[6px]"
        )}
      >
        <h2 className="text-base md:text-[20px] font-[500] leading-6 text-black">
          {t("worldCupWinnerProbability")}
        </h2>
      </div>

      {showChart ? <ChartLegend items={legendValues} className="mt-3" /> : null}

      {!showChart && fetchStatus === "loading" ? (
        <p className="mt-4 py-8 text-center text-sm text-[#909090]">
          {t("loadingProbabilityHistory")}
        </p>
      ) : !showChart && fetchStatus === "error" ? (
        <p className="mt-4 py-8 text-center text-sm text-[#909090]">
          {t("unableToLoadProbabilityHistory")}
        </p>
      ) : !showChart && fetchStatus === "empty" ? (
        <p className="mt-4 py-8 text-center text-sm text-[#909090]">
          {t("marketTokenUnavailable")}
        </p>
      ) : (
        <div className="mt-4 h-[190px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 8,
                right: showAxisTooltip ? 12 : 0,
                left: 8,
                bottom: showAxisTooltip ? 8 : 0
              }}
            >
              {showAxisTooltip ? (
                <XAxis
                  dataKey="date"
                  padding={{ left: 0, right: 6 }}
                  tick={{
                    fill: "#909090",
                    fontSize: 14,
                    dy: 6
                  }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={32}
                  tickFormatter={formatXAxisTick}
                />
              ) : (
                <XAxis dataKey="date" hide />
              )}
              <YAxis
                orientation={showAxisTooltip ? "left" : "right"}
                domain={yAxis.domain}
                ticks={yAxis.ticks}
                tick={{ fill: "#909090", fontSize: 14 }}
                tickFormatter={(value: number) => `${value}%`}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                cursor={{ stroke: "#EBEBEB", strokeWidth: 1 }}
                content={<WinnerChartTooltip series={series} />}
              />
              {series.map((item) => (
                <Line
                  key={item.dataKey}
                  type="monotone"
                  dataKey={item.dataKey}
                  stroke={item.color}
                  strokeWidth={1}
                  dot={renderEndDot(chartData.length, item.color)}
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
      )}
    </section>
  );
}

function ChartLegend({
  items,
  className
}: {
  items: ReturnType<typeof getLatestSeriesValues>;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "md:flex md:flex-wrap gap-x-8 gap-y-2 grid grid-cols-2",
        className
      )}
    >
      {items.map((item) => (
        <ChartLegendItem key={item.teamId} item={item} />
      ))}
    </div>
  );
}

function WinnerChartTooltip({
  active,
  payload,
  label,
  series
}: TooltipProps<number, string> & {
  series: WinnerChartSeriesConfig[];
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const dateLabel = typeof label === "string" ? label : String(label ?? "");

  return (
    <div className="rounded-xl border border-[#EBEBEB] bg-white px-3 py-2 shadow-[0_0_10px_rgba(0,0,0,0.1)]">
      <p className="m-0 mb-1 text-sm font-[400] leading-[17px] text-[#909090]">
        {formatWinnerChartTooltipDate(dateLabel)}
      </p>
      {payload.map((entry) => {
        const item = series.find(
          (seriesItem) => seriesItem.dataKey === entry.dataKey
        );

        return (
          <WinnerChartTooltipRow
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

function WinnerChartTooltipRow({
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
    <p
      className="m-0 text-sm font-[400] leading-[24px]"
      style={{ color }}
    >
      {teamDisplayName}: {value}
    </p>
  );
}

function ChartLegendItem({
  item
}: {
  item: ReturnType<typeof getLatestSeriesValues>[number];
}) {
  const teamDisplayName = useLocalizedTeamName(item.teamCode, item.label);

  return (
    <div className="flex items-center gap-2 text-[14px] leading-[17px]">
      <span
        className="h-3 w-3 shrink-0 rounded-full"
        style={{ backgroundColor: item.color }}
        aria-hidden="true"
      />
      <span className="text-[#909090]">{teamDisplayName}</span>
      <span className="font-[500] text-black">
        {formatProbability(item.value)}
      </span>
    </div>
  );
}
