"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps
} from "recharts";

import { formatProbability } from "@/components/home/market-formatters";
import type { GameProbabilityHistoryPoint } from "@/types/market";

const CHART_LINE_COLOR = "#8AB956";

interface GameProbabilityChartProps {
  chartData: GameProbabilityHistoryPoint[];
  yDomain: [number, number];
}

export function GameProbabilityChart({
  chartData,
  yDomain
}: GameProbabilityChartProps) {
  const formattedData = useMemo(
    () =>
      chartData.map((point) => ({
        ...point,
        label: new Date(point.timestamp).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric"
        })
      })),
    [chartData]
  );

  return (
    <div className="h-[267px] w-full min-h-[240px] sm:h-[280px] xl:h-[324px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gameProbFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(138, 185, 86, 0.3)" />
              <stop offset="100%" stopColor="rgba(138, 185, 86, 0)" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#909090", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            domain={yDomain}
            tick={{ fill: "#909090", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={36}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="probability"
            stroke={CHART_LINE_COLOR}
            fill="url(#gameProbFill)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: CHART_LINE_COLOR }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.[0]) {
    return null;
  }

  return (
    <div className="rounded-lg border border-prophet-line bg-white px-3 py-2 shadow-sm">
      <p className="m-0 text-sm font-[556] text-black">
        {formatProbability(Number(payload[0].value))}
      </p>
    </div>
  );
}
