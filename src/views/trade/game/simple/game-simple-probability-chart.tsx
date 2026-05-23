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

import type {
  GameMatchChartEvent,
  GameMatchMinuteHistoryPoint
} from "@/types/market";
import { gameSimpleColors } from "@/views/trade/game/simple/game-simple-ui";

interface ChartRow extends GameMatchMinuteHistoryPoint {
  label: string;
}

interface GameSimpleProbabilityChartProps {
  data: GameMatchMinuteHistoryPoint[];
  events: GameMatchChartEvent[];
}

const SERIES = [
  { key: "home" as const, color: gameSimpleColors.home },
  { key: "draw" as const, color: gameSimpleColors.draw },
  { key: "away" as const, color: gameSimpleColors.awayChart }
];

export function GameSimpleProbabilityChart({
  data,
  events
}: GameSimpleProbabilityChartProps) {
  const chartData = useMemo<ChartRow[]>(
    () =>
      data.map((point) => ({
        ...point,
        label: point.minuteLabel
      })),
    [data]
  );

  const yDomain = useMemo(() => {
    const values = data.flatMap((point) => [point.home, point.draw, point.away]);
    const max = Math.max(...values, 60);
    const roundedMax = Math.ceil(max / 10) * 10;
    return [0, Math.max(60, roundedMax)] as [number, number];
  }, [data]);

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
    <div className="h-[320px] w-full min-h-[280px] sm:h-[360px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 24, right: 48, left: 8, bottom: 8 }}>
          <CartesianGrid stroke="#EBEBEB" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: gameSimpleColors.muted, fontSize: 14 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={yDomain}
            orientation="right"
            tick={{ fill: gameSimpleColors.muted, fontSize: 14 }}
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
                      y2={cy - 28}
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
              activeDot={{ r: 5, strokeWidth: 2 }}
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
    <div className="rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm shadow-sm">
      <p className="m-0 mb-1 font-[556] text-black">{label}</p>
      {payload.map((entry) => (
        <p
          key={String(entry.dataKey)}
          className="m-0 font-[556]"
          style={{ color: entry.color }}
        >
          {entry.dataKey}: {Number(entry.value).toFixed(1)}%
        </p>
      ))}
    </div>
  );
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
