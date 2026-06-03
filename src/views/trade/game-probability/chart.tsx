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
  formatGoalEventTime,
  formatMatchMinuteAxisLabel,
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
  GoalEventMarkerChartProvider,
  GoalEventMarkerCustomized,
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

type EndDotWithLabelProps = {
  cx?: number;
  cy?: number;
  index?: number;
  value?: number;
  payload?: ChartRow;
  dataLength: number;
  series: (typeof SERIES)[number];
};

function EndDotWithLabel({
  cx,
  cy,
  index,
  value,
  payload,
  dataLength,
  series
}: EndDotWithLabelProps): ReactElement<SVGElement> {
  if (index !== dataLength - 1 || cx === undefined || cy === undefined) {
    return <g />;
  }

  const probability = typeof value === "number" ? value : payload?.[series.key];
  const hasProbability = typeof probability === "number";
  const probabilityLabel = hasProbability
    ? formatProbability(probability)
    : "—";
  const numberPart = hasProbability
    ? probabilityLabel.slice(0, -1)
    : probabilityLabel;

  const lineTop = cy - 40;
  const labelX = cx - 10;

  return (
    <g>
      <circle cx={cx} cy={cy} r={10} fill={series.color} fillOpacity={0.2} />
      <line
        x1={cx}
        y1={lineTop}
        x2={cx}
        y2={cy}
        stroke={series.color}
        strokeWidth={1.5}
      />
      <circle cx={cx} cy={cy} r={5} fill={series.color} />
      <text
        x={labelX}
        y={lineTop + 4}
        textAnchor="end"
        dominantBaseline="hanging"
      >
        <tspan fill={series.color} fontSize={26} fontWeight={600}>
          {numberPart}%
        </tspan>
      </text>
    </g>
  );
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

  const yDomain = useMemo(
    () => getFixtureChartYDomain(data, { endLabelHeadroomPercent: 14 }),
    [data]
  );
  const dataLength = chartData.length;

  const resolvedMaxElapsed = useMemo(() => {
    if (!isLive) {
      return 0;
    }

    if (maxElapsedSeconds > 0) {
      return maxElapsedSeconds;
    }

    return Math.max(
      ...data.map((point) => point.elapsedSeconds ?? 0),
      LIVE_MATCH_CHART_AXIS_MAX_ELAPSED_SECONDS
    );
  }, [data, isLive, maxElapsedSeconds]);

  const goalMarkerConfig = useMemo(
    () => ({
      events,
      maxElapsedSeconds: resolvedMaxElapsed,
      homeCode,
      homeName: homeLabel,
      awayCode,
      awayName: awayLabel,
    }),
    [
      awayCode,
      awayLabel,
      events,
      homeCode,
      homeLabel,
      resolvedMaxElapsed,
    ]
  );

  if (data.length === 0) {
    return null;
  }

  const chart = (
            <LineChart
              data={chartData}
              margin={{
                top: 56,
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
                padding={{ left: 0, right: 58 }}
                tickFormatter={
                  isLive
                    ? (value: number) => formatMatchMinuteAxisLabel(value)
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
                  strokeWidth={1}
                  isAnimationActive={false}
                  dot={(props) => (
                    <EndDotWithLabel
                      {...props}
                      dataLength={dataLength}
                      series={series}
                    />
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
                <Customized component={GoalEventMarkerCustomized} />
              ) : null}
            </LineChart>
  );

  const chartBody = (
    <ResponsiveContainer width="100%" height="100%">
      {chart}
    </ResponsiveContainer>
  );

  return (
    <div className="h-[280px] w-full min-h-[240px] sm:h-[320px] xl:h-[340px]">
      <div className="flex h-full gap-4">
        <div className="min-w-0 flex-1">
          {isLive ? (
            <GoalEventMarkerChartProvider value={goalMarkerConfig}>
              {chartBody}
            </GoalEventMarkerChartProvider>
          ) : (
            chartBody
          )}
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
    isLive && typeof label === "number"
      ? formatGoalEventTime(label)
      : isLive && point?.timestamp
        ? formatChartTimestampClockLabel(point.timestamp)
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
