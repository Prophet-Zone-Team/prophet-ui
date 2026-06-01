"use client";

import { useMemo, type ReactElement } from "react";
import {
  CartesianGrid,
  Customized,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps
} from "recharts";

import { formatProbability } from "@/components/home/market-formatters";
import {
  formatChartTimestampClockLabel,
  formatLiveChartClockLabel,
} from "@/lib/market/match-display";
import {
  formatGameChartXAxisTick,
  getFixtureChartYDomain,
} from "@/lib/market/fixture-probability-chart";
import {
  LIVE_MATCH_CHART_AXIS_MAX_ELAPSED_SECONDS,
  resolveLiveChartAxisTicks
} from "@/lib/market/live-fixture-probability-chart";
import type {
  GameFixtureChartPoint,
  GameFixtureChartTimeRange,
  GameMatchChartEvent,
} from "@/types/market";
import {
  GoalEventMarkerLayer,
  type GoalEventMarkerLayerProps,
} from "@/views/trade/game-probability/goal-event-marker-layer";

const CHART_COLORS = {
  home: "#3168FF",
  draw: "#D9D9D9",
  away: "#F4B600",
  grid: "#EBEBEB",
  muted: "#909090"
} as const;

const SERIES = [
  { key: "home" as const, color: CHART_COLORS.home, label: "Home" },
  { key: "draw" as const, color: CHART_COLORS.draw, label: "Draw" },
  { key: "away" as const, color: CHART_COLORS.away, label: "Away" }
];

interface ChartRow extends GameFixtureChartPoint {
  chartLabel: string;
}

function renderEndDotWithLabel(
  dataLength: number,
  series: (typeof SERIES)[number],
  outcomeLabel: string
): (props: {
  cx?: number;
  cy?: number;
  index?: number;
  value?: number;
  payload?: ChartRow;
}) => ReactElement<SVGElement> {
  return function EndDotWithLabel({ cx, cy, index, value, payload }) {
    if (
      index !== dataLength - 1 ||
      cx === undefined ||
      cy === undefined
    ) {
      return <g />;
    }

    const probability =
      typeof value === "number" ? value : payload?.[series.key];
    const probabilityLabel =
      typeof probability === "number" ? formatProbability(probability) : "—";

    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={5}
          fill={series.color}
          stroke={`${series.color}33`}
          strokeWidth={3}
        />
        <text x={cx + 10} y={cy - 2} textAnchor="start">
          <tspan x={cx + 10} dy={0} fill={CHART_COLORS.muted} fontSize={12}>
            {outcomeLabel}
          </tspan>
          <tspan x={cx + 10} dy={14} fill="#000" fontSize={12} fontWeight={556}>
            {probabilityLabel}
          </tspan>
        </text>
      </g>
    );
  };
}

export interface GameProbabilityChartProps {
  data: GameFixtureChartPoint[];
  homeLabel?: string;
  drawLabel?: string;
  awayLabel?: string;
  mode?: "historical" | "live";
  timeRange?: GameFixtureChartTimeRange;
  events?: GameMatchChartEvent[];
  maxElapsedSeconds?: number;
  kickoffAt?: string;
  homeCode?: string;
  awayCode?: string;
}

export function GameProbabilityChart({
  data,
  homeLabel = "Home",
  drawLabel = "Draw",
  awayLabel = "Away",
  mode = "historical",
  timeRange = "all",
  events = [],
  maxElapsedSeconds = 0,
  kickoffAt,
  homeCode,
  awayCode,
}: GameProbabilityChartProps) {
  const isLive = mode === "live";

  const seriesLabels = useMemo(
    () => ({
      home: homeLabel,
      draw: drawLabel,
      away: awayLabel
    }),
    [awayLabel, drawLabel, homeLabel]
  );

  const chartData = useMemo<ChartRow[]>(
    () =>
      data.map((point) => ({
        ...point,
        chartLabel: point.label
      })),
    [data]
  );

  const yDomain = useMemo(() => getFixtureChartYDomain(data), [data]);

  if (data.length === 0) {
    return null;
  }

  const resolvedMaxElapsed = isLive
    ? maxElapsedSeconds > 0
      ? maxElapsedSeconds
      : Math.max(
          ...data.map((point) => point.elapsedSeconds ?? 0),
          LIVE_MATCH_CHART_AXIS_MAX_ELAPSED_SECONDS
        )
    : 0;

  return (
    <div className="h-[280px] w-full min-h-[240px] sm:h-[320px] xl:h-[340px]">
      <div className="flex h-full gap-4">
        <div className="min-w-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 28,
                right: 8,
                left: 4,
                bottom: isLive ? 36 : 4
              }}
            >
              <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
              <XAxis
                type={isLive ? "number" : "category"}
                dataKey={isLive ? "elapsedSeconds" : "timestamp"}
                domain={isLive ? [0, resolvedMaxElapsed] : undefined}
                ticks={
                  isLive
                    ? resolveLiveChartAxisTicks(resolvedMaxElapsed)
                    : undefined
                }
                tick={{ fill: CHART_COLORS.muted, fontSize: 14, dy: 6 }}
                axisLine={false}
                tickLine={false}
                minTickGap={24}
                padding={{ left: 0, right: 88 }}
                tickFormatter={
                  isLive
                    ? (value: number) =>
                        formatLiveChartClockLabel(kickoffAt, value)
                    : (value: string) =>
                        formatGameChartXAxisTick(value, timeRange)
                }
              />
              <YAxis
                domain={yDomain}
                orientation="right"
                tick={{ fill: CHART_COLORS.muted, fontSize: 14 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: number) => `${value}%`}
                width={44}
              />
              <Tooltip
                content={
                  <ChartTooltip
                    seriesLabels={seriesLabels}
                    isLive={isLive}
                    kickoffAt={kickoffAt}
                    timeRange={timeRange}
                  />
                }
              />
              {SERIES.map((series) => (
                <Line
                  key={series.key}
                  type="monotone"
                  dataKey={series.key}
                  stroke={series.color}
                  strokeWidth={2}
                  dot={renderEndDotWithLabel(
                    chartData.length,
                    series,
                    seriesLabels[series.key]
                  )}
                  activeDot={{
                    r: 5,
                    fill: series.color,
                    stroke: `${series.color}33`,
                    strokeWidth: 3
                  }}
                />
              ))}
              {isLive ? (
                <Customized
                  component={(props: Record<string, unknown>) => (
                    <GoalEventMarkerLayer
                      offset={
                        props.offset as GoalEventMarkerLayerProps["offset"]
                      }
                      width={props.width as number | undefined}
                      height={props.height as number | undefined}
                      maxElapsedSeconds={resolvedMaxElapsed}
                      events={events}
                      homeCode={homeCode}
                      homeName={homeLabel}
                      awayCode={awayCode}
                      awayName={awayLabel}
                    />
                  )}
                />
              ) : null}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  seriesLabels,
  isLive,
  kickoffAt,
  timeRange,
}: TooltipProps<number, string> & {
  seriesLabels: Record<(typeof SERIES)[number]["key"], string>;
  isLive: boolean;
  kickoffAt?: string;
  timeRange: GameFixtureChartTimeRange;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload as ChartRow | undefined;
  const timeLabel =
    isLive && point?.timestamp
      ? formatChartTimestampClockLabel(point.timestamp)
      : typeof label === "number"
        ? formatLiveChartClockLabel(kickoffAt, label)
        : formatGameChartXAxisTick(String(label ?? ""), timeRange);

  return (
    <div className="rounded-xl border border-[#EBEBEB] bg-white px-3 py-2 shadow-[0_0_10px_rgba(0,0,0,0.1)]">
      <p className="m-0 mb-1 text-sm font-[400] leading-[17px] text-[#909090]">
        {timeLabel}
      </p>
      {payload.map((entry) => {
        const series = SERIES.find((item) => item.key === entry.dataKey);

        return (
          <p
            key={String(entry.dataKey)}
            className="m-0 text-[12px] font-[400] leading-[20px]"
            style={{ color: entry.color }}
          >
            {series ? seriesLabels[series.key] : entry.dataKey}:{" "}
            {typeof entry.value === "number"
              ? formatProbability(entry.value)
              : "—"}
          </p>
        );
      })}
    </div>
  );
}
