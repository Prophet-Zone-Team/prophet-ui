"use client";

import { useId } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";

import { cn } from "@/lib/cn";
import {
  PORTFOLIO_PNL_CHART_NEGATIVE,
  PORTFOLIO_PNL_CHART_POSITIVE,
} from "@/lib/portfolio/share-card-config";
import type { PortfolioSeriesPoint } from "@/lib/portfolio/types";

export type PortfolioPnlAreaChartProps = {
  series: PortfolioSeriesPoint[];
  isPositive: boolean;
  className?: string;
  interactive?: boolean;
  onMouseMove?: (state: { activeTooltipIndex?: number }) => void;
  onMouseLeave?: () => void;
};

export function PortfolioPnlAreaChart({
  series,
  isPositive,
  className,
  interactive = true,
  onMouseMove,
  onMouseLeave,
}: PortfolioPnlAreaChartProps) {
  const gradientId = useId().replace(/:/g, "");
  const chartTone = isPositive
    ? PORTFOLIO_PNL_CHART_POSITIVE
    : PORTFOLIO_PNL_CHART_NEGATIVE;

  return (
    <div className={cn("h-full w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={series}
          margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
          onMouseMove={interactive ? onMouseMove : undefined}
          onMouseLeave={interactive ? onMouseLeave : undefined}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={chartTone.fillTop} />
              <stop
                offset="100%"
                stopColor={
                  isPositive
                    ? "rgba(138, 185, 86, 0)"
                    : "rgba(229, 72, 77, 0)"
                }
              />
            </linearGradient>
          </defs>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          {interactive ? (
            <Tooltip
              cursor={{
                stroke: "#999999",
                strokeWidth: 1,
              }}
              content={() => null}
              isAnimationActive={false}
            />
          ) : null}
          <Area
            type="monotone"
            dataKey="value"
            baseValue="dataMin"
            stroke={chartTone.stroke}
            strokeWidth={1}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
            activeDot={
              interactive
                ? {
                    r: 4,
                    fill: chartTone.stroke,
                    stroke: "#FFFFFF",
                    strokeWidth: 2,
                  }
                : false
            }
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
