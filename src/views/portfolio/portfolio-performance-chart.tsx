"use client";

import { useId, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";

import { cn } from "@/lib/cn";
import {
  formatSignedPercent,
} from "@/lib/portfolio/portfolio-format";
import type {
  PortfolioTimeRange
} from "@/lib/portfolio/types";
import { portfolioSummaryLabelClass } from "@/views/portfolio/portfolio-ui";
import { formatNumber } from "@/utils";
import { usePortfolioContext } from "./context";

const CHART_LINE_COLOR = "#65AF14";
const CHART_FILL_TOP = "rgba(138, 185, 86, 0.3)";

const TIME_RANGES: PortfolioTimeRange[] = ["1H", "1D", "1W", "1M", "All"];

export interface PortfolioPerformanceChartProps {
}

export function PortfolioPerformanceChart({ }: PortfolioPerformanceChartProps) {
  const {
    session,
    portfolio,
    status,
    onConnectWallet
  } = usePortfolioContext();
  const {
    performanceSeries: series,
    unrealizedPnl,
    unrealizedPnlPercent
  } = portfolio ?? {};

  const [range, setRange] = useState<PortfolioTimeRange>("1M");
  const gradientId = useId().replace(/:/g, "");
  const isPositive = !!unrealizedPnl && unrealizedPnl >= 0;
  const pnlTone = isPositive ? "text-prophet-green" : "text-prophet-red";

  return (
    <div className="flex w-full md:w-1/2 flex-col justify-between gap-4 border-t border-prophet-line pt-6 lg:border-t-0 lg:pl-8 lg:pt-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className={portfolioSummaryLabelClass}>Profit / Loss</span>
          <div className="flex flex-wrap items-baseline gap-2">
            <span
              className={cn("text-[32px] font-[556] leading-[38px]", pnlTone)}
            >
              {formatNumber(unrealizedPnl, 2, true, { round: 0, prefix: !!unrealizedPnl && unrealizedPnl >= 0 ? "+" : "", isZeroPrecision: true })}
            </span>
            <span
              className={cn(
                "text-base font-[556] leading-[19px] capitalize",
                pnlTone
              )}
            >
              {formatSignedPercent(unrealizedPnlPercent)}
            </span>
          </div>
        </div>
        <div
          className="flex shrink-0 gap-4"
          role="tablist"
          aria-label="Portfolio performance time range"
        >
          {TIME_RANGES.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={range === item}
              onClick={() => setRange(item)}
              className={cn(
                "border-0 bg-transparent p-0 text-sm font-[556] leading-[17px] transition-colors",
                range === item
                  ? "text-black"
                  : "text-prophet-muted hover:text-black"
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[83px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={series}
            margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={CHART_FILL_TOP} />
                <stop offset="100%" stopColor="rgba(138, 185, 86, 0)" />
              </linearGradient>
            </defs>
            <Tooltip
              contentStyle={{
                background: "#fff",
                border: "1px solid #ebebeb",
                borderRadius: 8,
                color: "#000",
                fontSize: 12
              }}
              formatter={(value: number) => [
                formatNumber(value, 2, true, { round: 0 }),
                "Value"
              ]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={CHART_LINE_COLOR}
              strokeWidth={1}
              fill={`url(#${gradientId})`}
              activeDot={{ r: 3, fill: CHART_LINE_COLOR }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
