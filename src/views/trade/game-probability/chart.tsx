"use client";

import { useMemo } from "react";
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
import { formatMatchMinuteAxisLabel } from "@/lib/market/match-display";
import {
  formatGameChartXAxisTick,
  getFixtureChartYDomain,
} from "@/lib/market/fixture-probability-chart";
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

export interface GameProbabilityChartProps {
  data: GameFixtureChartPoint[];
  homeLabel?: string;
  drawLabel?: string;
  awayLabel?: string;
  mode?: "historical" | "live";
  timeRange?: GameFixtureChartTimeRange;
  events?: GameMatchChartEvent[];
  maxElapsedSeconds?: number;
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

  const resolvedMaxElapsed =
    maxElapsedSeconds > 0
      ? maxElapsedSeconds
      : Math.max(...data.map((point) => point.elapsedSeconds ?? 0), 1);

  return (
    <div className="h-[280px] w-full min-h-[240px] sm:h-[320px] xl:h-[340px]">
      <div className="flex h-full gap-4">
        <div className="min-w-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 28,
                right: 12,
                left: 4,
                bottom: isLive ? 36 : 4,
              }}
            >
              <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
              <XAxis
                dataKey={isLive ? "chartLabel" : "timestamp"}
                tick={{ fill: CHART_COLORS.muted, fontSize: 14, dy: 6 }}
                axisLine={false}
                tickLine={false}
                minTickGap={24}
                padding={{ left: 0, right: 32 }}
                interval={isLive ? "preserveStartEnd" : undefined}
                tickFormatter={
                  isLive
                    ? undefined
                    : (value: string) => formatGameChartXAxisTick(value, timeRange)
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
                  dot={(props) => {
                    const { cx, cy, index } = props;
                    if (
                      index !== chartData.length - 1 ||
                      cx === undefined ||
                      cy === undefined
                    ) {
                      return <g />;
                    }

                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill={series.color}
                        stroke={`${series.color}33`}
                        strokeWidth={3}
                      />
                    );
                  }}
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
                      offset={props.offset as GoalEventMarkerLayerProps["offset"]}
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
  timeRange,
}: TooltipProps<number, string> & {
  seriesLabels: Record<(typeof SERIES)[number]["key"], string>;
  isLive: boolean;
  timeRange: GameFixtureChartTimeRange;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const timeLabel =
    typeof label === "number"
      ? formatMatchMinuteAxisLabel(label)
      : isLive
        ? String(label ?? "")
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
