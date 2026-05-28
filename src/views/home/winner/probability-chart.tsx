"use client";

import { useMemo, useState, type ReactElement } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis
} from "recharts";

import { formatProbability } from "@/components/home/market-formatters";
import { cn } from "@/lib/cn";
import {
  buildWinnerChartData,
  filterWinnerChartByRange,
  getLatestSeriesValues,
  getWinnerChartYDomain,
  WINNER_CHART_TIME_RANGES,
  type WinnerChartTimeRange
} from "@/lib/market/winner-probability-chart";
import type {
  ProbabilityHistoryPoint,
  TeamMarketSnapshot
} from "@/types/market";

export interface WinnerProbabilityChartProps {
  className?: string;
  teams: TeamMarketSnapshot[];
  probabilityHistory: ProbabilityHistoryPoint[];
}

function renderEndDot(
  dataLength: number,
  color: string
): (props: { cx?: number; cy?: number; index?: number }) => ReactElement<SVGElement> {
  return function EndDot({ cx, cy, index }) {
    if (
      index !== dataLength - 1 ||
      cx === undefined ||
      cy === undefined
    ) {
      return <g />;
    }

    return <circle cx={cx} cy={cy} r={6} fill={color} stroke={color} />;
  };
}

export function WinnerProbabilityChart({
  className,
  teams,
  probabilityHistory
}: WinnerProbabilityChartProps) {
  const [timeRange, setTimeRange] = useState<WinnerChartTimeRange>("1M");

  console.log("teams", teams);

  const { series, points } = useMemo(
    () => buildWinnerChartData(teams, probabilityHistory),
    [teams, probabilityHistory]
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

  return (
    <section
      className={cn(
        "min-w-0 rounded-xl border border-[#EBEBEB] bg-white px-5 pb-5 pt-4",
        className
      )}
      aria-label="World Cup winner probability chart"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 pr-[6px]">
        <h2 className="text-[20px] font-[500] leading-6 text-black">
          World Cup Winner Probability
        </h2>

        <TimeRangePicker value={timeRange} onChange={setTimeRange} />
      </div>

      <ChartLegend items={legendValues} className="mt-3" />

      <div className="mt-4 h-[190px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 0, left: 8, bottom: 0 }}
          >
            <XAxis dataKey="date" hide />
            <YAxis
              orientation="right"
              domain={yAxis.domain}
              ticks={yAxis.ticks}
              tick={{ fill: "#909090", fontSize: 14 }}
              tickFormatter={(value: number) => `${value}%`}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            {series.map((item) => (
              <Line
                key={item.dataKey}
                type="monotone"
                dataKey={item.dataKey}
                stroke={item.color}
                strokeWidth={1}
                dot={renderEndDot(chartData.length, item.color)}
                activeDot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function TimeRangePicker({
  value,
  onChange
}: {
  value: WinnerChartTimeRange;
  onChange: (value: WinnerChartTimeRange) => void;
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-4"
      role="group"
      aria-label="Probability chart time range"
    >
      {WINNER_CHART_TIME_RANGES.map((range) => {
        const isActive = range.id === value;

        return (
          <button
            key={range.id}
            type="button"
            onClick={() => onChange(range.id)}
            className={cn(
              "border-0 bg-transparent p-0 text-sm leading-[17px]",
              isActive ? "font-[556] text-black" : "font-[457] text-[#909090]"
            )}
          >
            {range.label}
          </button>
        );
      })}
    </div>
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
    <div className={cn("flex flex-wrap gap-x-8 gap-y-2", className)}>
      {items.map((item) => (
        <ChartLegendItem key={item.teamId} item={item} />
      ))}
    </div>
  );
}

function ChartLegendItem({
  item
}: {
  item: ReturnType<typeof getLatestSeriesValues>[number];
}) {
  return (
    <div className="flex items-center gap-2 text-[14px] leading-[17px]">
      <span
        className="h-3 w-3 shrink-0 rounded-full"
        style={{ backgroundColor: item.color }}
        aria-hidden="true"
      />
      <span className="text-[#909090]">{item.label}</span>
      <span className="font-[556] text-black">
        {formatProbability(item.value)}
      </span>
    </div>
  );
}
