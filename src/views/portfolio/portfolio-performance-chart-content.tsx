"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";

import { cn } from "@/lib/cn";
import {
  formatPortfolioPnlHoverTime,
  getPortfolioPnlPeriodLabel
} from "@/lib/portfolio/portfolio-format";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import type {
  PortfolioLoadStatus,
  PortfolioSeriesPoint,
  PortfolioTimeRange
} from "@/lib/portfolio/types";
import { portfolioSummaryLabelClass } from "@/views/portfolio/portfolio-ui";

const TIME_RANGES: PortfolioTimeRange[] = ["1D", "1W", "1M", "YTD", "All"];

const CHART_POSITIVE = {
  stroke: "#65AF14",
  fillTop: "rgba(138, 185, 86, 0.3)"
};

const CHART_NEGATIVE = {
  stroke: "#E5484D",
  fillTop: "rgba(229, 72, 77, 0.3)"
};

export interface PortfolioPerformanceChartContentProps<
  TRange extends string = PortfolioTimeRange
> {
  series: PortfolioSeriesPoint[];
  status?: PortfolioLoadStatus;
  range?: TRange;
  onRangeChange?: (range: TRange) => void;
  className?: string;
  rangeOptions?: readonly TRange[];
  defaultRange?: TRange;
  getRangePeriodLabel?: (range: TRange) => string;
  profitLossLabel?: string;
  performanceTimeRangeAriaLabel?: string;
}

export function PortfolioPerformanceChartContent<
  TRange extends string = PortfolioTimeRange
>({
  series,
  status = "ready",
  range: controlledRange,
  onRangeChange,
  className,
  rangeOptions,
  defaultRange = "All" as TRange,
  getRangePeriodLabel,
  profitLossLabel,
  performanceTimeRangeAriaLabel
}: PortfolioPerformanceChartContentProps<TRange>) {
  const t = useTranslations("portfolio");
  const locale = useLocale();
  const effectiveRangeOptions = (rangeOptions ??
    TIME_RANGES) as readonly TRange[];
  const [internalRange, setInternalRange] = useState<TRange>(defaultRange);
  const range = controlledRange ?? internalRange;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const gradientId = useId().replace(/:/g, "");

  const handleRangeChange = (nextRange: TRange) => {
    if (onRangeChange) {
      onRangeChange(nextRange);
      return;
    }

    setInternalRange(nextRange);
  };

  useEffect(() => {
    setActiveIndex(null);
  }, [range, series]);

  const displayIndex = useMemo(() => {
    if (series.length === 0) {
      return -1;
    }

    if (
      activeIndex != null &&
      activeIndex >= 0 &&
      activeIndex < series.length
    ) {
      return activeIndex;
    }

    return series.length - 1;
  }, [activeIndex, series]);

  const displayPnl = displayIndex >= 0 ? (series[displayIndex]?.value ?? 0) : 0;
  const displayTimestamp = series[displayIndex]?.timestamp;
  const chartTone = displayPnl >= 0 ? CHART_POSITIVE : CHART_NEGATIVE;
  const pnlTone = displayPnl >= 0 ? "text-prophet-green" : "text-prophet-red";
  const isLoading = status === "loading";
  const timeLabel =
    activeIndex != null
      ? formatPortfolioPnlHoverTime(displayTimestamp, locale)
      : getRangePeriodLabel
        ? getRangePeriodLabel(range)
        : getPortfolioPnlPeriodLabel(t, range as PortfolioTimeRange);

  const handleChartMouseMove = (state: { activeTooltipIndex?: number }) => {
    const index = state?.activeTooltipIndex;

    if (typeof index === "number" && index >= 0) {
      setActiveIndex(index);
    }
  };

  return (
    <div
      className={cn(
        "flex w-full md:w-1/2 flex-col justify-between gap-4 border-t border-prophet-line pt-6 lg:border-t-0 lg:pl-8 lg:pt-0",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className={portfolioSummaryLabelClass}>
            {profitLossLabel ?? t("profitLoss")}
          </span>
          <div className="flex flex-col gap-1">
            <span
              className={cn("text-[32px] font-[500] leading-[38px]", pnlTone)}
            >
              {formatTeamDetailMoney(displayPnl)}
            </span>
            <span className="text-sm text-[#909090]">{timeLabel}</span>
          </div>
        </div>
        <div
          className="flex shrink-0 gap-4"
          role="tablist"
          aria-label={performanceTimeRangeAriaLabel ?? t("performanceTimeRange")}
        >
          {effectiveRangeOptions.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={range === item}
              onClick={() => handleRangeChange(item)}
              className={cn(
                "border-0 bg-transparent p-0 text-sm font-[500] leading-[17px] transition-colors",
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

      <div
        className={cn(
          "h-[83px] w-full",
          isLoading && "animate-pulse opacity-60"
        )}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={series}
            margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
            onMouseMove={handleChartMouseMove}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={chartTone.fillTop} />
                <stop
                  offset="100%"
                  stopColor={
                    displayPnl >= 0
                      ? "rgba(138, 185, 86, 0)"
                      : "rgba(229, 72, 77, 0)"
                  }
                />
              </linearGradient>
            </defs>
            <YAxis hide domain={["dataMin", "dataMax"]} />
            <Tooltip
              cursor={{
                stroke: "#999999",
                strokeWidth: 1
              }}
              content={() => null}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="value"
              baseValue="dataMin"
              stroke={chartTone.stroke}
              strokeWidth={1}
              fill={`url(#${gradientId})`}
              activeDot={{
                r: 4,
                fill: chartTone.stroke,
                stroke: "#FFFFFF",
                strokeWidth: 2
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
