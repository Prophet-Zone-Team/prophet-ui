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
  getFixtureChartYDomain,
  getLatestFixtureChartValues
} from "@/lib/market/fixture-probability-chart";
import type { GameFixtureChartPoint } from "@/types/market";

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
}

export function GameProbabilityChart({
  data,
  homeLabel = "Home",
  drawLabel = "Draw",
  awayLabel = "Away"
}: GameProbabilityChartProps) {
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
  const latestValues = useMemo(() => getLatestFixtureChartValues(data), [data]);

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
              <Tooltip content={<ChartTooltip seriesLabels={seriesLabels} />} />
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
  seriesLabels
}: TooltipProps<number, string> & {
  seriesLabels: Record<(typeof SERIES)[number]["key"], string>;
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
        const series = SERIES.find((item) => item.key === entry.dataKey);

        return (
          <p
            key={String(entry.dataKey)}
            className="m-0 text-sm font-[556] leading-[17px]"
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
