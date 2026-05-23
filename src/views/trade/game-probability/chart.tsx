"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps
} from "recharts";

import { formatProbability } from "@/components/home/market-formatters";
import type {
  GameMatchChartEvent,
  GameMatchMinuteHistoryPoint
} from "@/types/market";

const CHART_COLORS = {
  home: "#8AB956",
  draw: "#909090",
  away: "#FF674B",
  grid: "#EBEBEB",
  muted: "#909090"
} as const;

const SERIES = [
  { key: "home" as const, color: CHART_COLORS.home, label: "Home" },
  { key: "draw" as const, color: CHART_COLORS.draw, label: "Draw" },
  { key: "away" as const, color: CHART_COLORS.away, label: "Away" }
];

interface ChartRow extends GameMatchMinuteHistoryPoint {
  label: string;
}

export interface GameProbabilityChartProps {
  data: GameMatchMinuteHistoryPoint[];
  events?: GameMatchChartEvent[];
}

export function GameProbabilityChart({
  data,
  events = []
}: GameProbabilityChartProps) {
  const chartData = useMemo<ChartRow[]>(
    () =>
      data.map((point) => ({
        ...point,
        label: point.minuteLabel
      })),
    [data]
  );

  const yDomain = useMemo(() => getMinuteChartYDomain(data), [data]);

  const goalDots = useMemo(
    () =>
      events
        .map((event) => {
          const point = findNearestPoint(data, event.minute);
          if (!point) {
            return null;
          }

          const value =
            event.side === "home"
              ? point.home
              : event.side === "away"
                ? point.away
                : point.draw;

          return {
            key: `${event.side}-${event.minute}`,
            label: point.minuteLabel,
            value
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null),
    [data, events]
  );

  return (
    <div className="h-[280px] w-full min-h-[240px] sm:h-[320px] xl:h-[340px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 28, right: 48, left: 4, bottom: 4 }}
        >
          <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: CHART_COLORS.muted, fontSize: 14 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={yDomain}
            orientation="right"
            tick={{ fill: CHART_COLORS.muted, fontSize: 14 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: number) => `${value}%`}
            width={40}
          />
          <Tooltip content={<ChartTooltip />} />
          {SERIES.map((series) => (
            <Line
              key={series.key}
              type="monotone"
              dataKey={series.key}
              stroke={series.color}
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, index, payload } = props;
                if (index !== chartData.length - 1 || !payload) {
                  return <g />;
                }

                const value = payload[series.key] as number;

                return (
                  <g key={series.key}>
                    <line
                      x1={cx}
                      x2={cx}
                      y1={cy}
                      y2={(cy ?? 0) - 28}
                      stroke={series.color}
                      strokeWidth={1}
                    />
                    <text
                      x={(cx ?? 0) + 8}
                      y={(cy ?? 0) - 32}
                      fill={series.color}
                      fontSize={20}
                      fontWeight={556}
                    >
                      {Math.round(value)}%
                    </text>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={5}
                      fill={series.color}
                      stroke={`${series.color}33`}
                      strokeWidth={3}
                    />
                  </g>
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
          {goalDots.map((goal) => (
            <ReferenceDot
              key={goal.key}
              x={goal.label}
              y={goal.value}
              r={0}
              label={{ value: "⚽", position: "top", fontSize: 16 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-[#EBEBEB] bg-white px-3 py-2 shadow-[0_0_10px_rgba(0,0,0,0.1)]">
      <p className="m-0 mb-1 text-sm font-[556] leading-[17px] text-[#909090]">
        {label}
      </p>
      {payload.map((entry) => {
        const series = SERIES.find((item) => item.key === entry.dataKey);

        return (
          <p
            key={String(entry.dataKey)}
            className="m-0 text-sm font-[556] leading-[17px]"
            style={{ color: entry.color }}
          >
            {series?.label ?? entry.dataKey}:{" "}
            {typeof entry.value === "number"
              ? formatProbability(entry.value)
              : "—"}
          </p>
        );
      })}
    </div>
  );
}

function getMinuteChartYDomain(
  data: GameMatchMinuteHistoryPoint[]
): [number, number] {
  if (data.length === 0) {
    return [0, 100];
  }

  const values = data.flatMap((point) => [point.home, point.draw, point.away]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max(2, (max - min) * 0.2);
  const lower = Math.max(0, Math.floor((min - padding) / 5) * 5);
  const upper = Math.min(100, Math.ceil((max + padding) / 5) * 5);

  return [lower, Math.max(lower + 10, upper)];
}

function findNearestPoint(
  data: GameMatchMinuteHistoryPoint[],
  minute: number
): GameMatchMinuteHistoryPoint | undefined {
  let nearest: GameMatchMinuteHistoryPoint | undefined;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const point of data) {
    const distance = Math.abs(point.minute - minute);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = point;
    }
  }

  return nearest;
}
