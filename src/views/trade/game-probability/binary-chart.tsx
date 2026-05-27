"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
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
  getBinaryFixtureChartYDomain,
} from "@/lib/market/fixture-probability-chart";
import type { GameFixtureBinaryChartPoint } from "@/types/market";

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
}

export function GameBinaryProbabilityChart({
  data,
  primaryLabel = "Primary",
  secondaryLabel = "Secondary",
  primaryColor = CHART_COLORS.primary,
  secondaryColor = CHART_COLORS.secondary
}: GameBinaryProbabilityChartProps) {
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

  return (
    <div className="h-[280px] w-full min-h-[240px] sm:h-[320px] xl:h-[340px]">
      <div className="flex h-full gap-4">
        <div className="min-w-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 28, right: 12, left: 4, bottom: 4 }}
            >
              <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
              <XAxis
                dataKey="chartLabel"
                tick={{ fill: CHART_COLORS.muted, fontSize: 14 }}
                axisLine={false}
                tickLine={false}
                minTickGap={24}
                padding={{ left: 0, right: 32 }}
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
                content={<BinaryChartTooltip series={series} />}
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
  series
}: TooltipProps<number, string> & {
  series: Array<{ key: "primary" | "secondary"; color: string; label: string }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-[#EBEBEB] bg-white px-3 py-2 shadow-[0_0_10px_rgba(0,0,0,0.1)]">
      <p className="m-0 mb-1 text-sm font-[556] leading-[17px] text-[#909090]">
        {label}
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
