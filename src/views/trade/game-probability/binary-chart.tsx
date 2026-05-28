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
  getBinaryFixtureChartYDomain,
} from "@/lib/market/fixture-probability-chart";
import type {
  GameFixtureBinaryChartPoint,
  GameFixtureChartTimeRange,
  GameMatchChartEvent,
} from "@/types/market";
import {
  GoalEventMarkerLayer,
  type GoalEventMarkerLayerProps,
} from "@/views/trade/game-probability/goal-event-marker-layer";

const CHART_COLORS = {
  primary: "#3168FF",
  secondary: "#F4B600",
  grid: "#EBEBEB",
  muted: "#909090"
} as const;

interface ChartRow extends GameFixtureBinaryChartPoint {
  chartLabel: string;
}

export interface GameBinaryProbabilityChartProps {
  data: GameFixtureBinaryChartPoint[];
  primaryLabel?: string;
  secondaryLabel?: string;
  primaryColor?: string;
  secondaryColor?: string;
  mode?: "historical" | "live";
  timeRange?: GameFixtureChartTimeRange;
  events?: GameMatchChartEvent[];
  maxElapsedSeconds?: number;
  homeCode?: string;
  awayCode?: string;
}

export function GameBinaryProbabilityChart({
  data,
  primaryLabel = "Primary",
  secondaryLabel = "Secondary",
  primaryColor = CHART_COLORS.primary,
  secondaryColor = CHART_COLORS.secondary,
  mode = "historical",
  timeRange = "all",
  events = [],
  maxElapsedSeconds = 0,
  homeCode,
  awayCode,
}: GameBinaryProbabilityChartProps) {
  const isLive = mode === "live";

  const series = useMemo(
    () => [
      { key: "primary" as const, color: primaryColor, label: primaryLabel },
      { key: "secondary" as const, color: secondaryColor, label: secondaryLabel }
    ],
    [primaryColor, primaryLabel, secondaryColor, secondaryLabel]
  );

  const chartData = useMemo<ChartRow[]>(
    () =>
      data.map((point) => ({
        ...point,
        chartLabel: point.label
      })),
    [data]
  );

  const yDomain = useMemo(() => getBinaryFixtureChartYDomain(data), [data]);

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
                tick={{ fill: CHART_COLORS.muted, fontSize: 14 }}
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
                  <BinaryChartTooltip
                    series={series}
                    isLive={isLive}
                    timeRange={timeRange}
                  />
                }
              />
              {series.map((item) => (
                <Line
                  key={item.key}
                  type="monotone"
                  dataKey={item.key}
                  stroke={item.color}
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
                        fill={item.color}
                        stroke={`${item.color}33`}
                        strokeWidth={3}
                      />
                    );
                  }}
                  activeDot={{
                    r: 5,
                    fill: item.color,
                    stroke: `${item.color}33`,
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
                      homeName={primaryLabel}
                      awayCode={awayCode}
                      awayName={secondaryLabel}
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

function BinaryChartTooltip({
  active,
  payload,
  label,
  series,
  isLive,
  timeRange,
}: TooltipProps<number, string> & {
  series: Array<{ key: "primary" | "secondary"; color: string; label: string }>;
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
      <p className="m-0 mb-1 text-sm font-[556] leading-[17px] text-[#909090]">
        {timeLabel}
      </p>
      {payload.map((entry) => {
        const item = series.find((seriesItem) => seriesItem.key === entry.dataKey);

        return (
          <p
            key={String(entry.dataKey)}
            className="m-0 text-sm font-[556] leading-[17px]"
            style={{ color: entry.color }}
          >
            {item?.label ?? entry.dataKey}:{" "}
            {typeof entry.value === "number"
              ? formatProbability(entry.value)
              : "—"}
          </p>
        );
      })}
    </div>
  );
}
