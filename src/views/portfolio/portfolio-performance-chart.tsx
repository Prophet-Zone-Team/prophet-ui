"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import {
  formatPortfolioPnlHoverTime,
  getPortfolioPnlPeriodLabel,
} from "@/lib/portfolio/portfolio-format";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import type { PortfolioTimeRange } from "@/lib/portfolio/types";
import { portfolioSummaryLabelClass } from "@/views/portfolio/portfolio-ui";

import { usePortfolioContext } from "./context";
import { PortfolioPnlAreaChart } from "./portfolio-pnl-area-chart";
import { PortfolioPnlShareModal } from "./portfolio-pnl-share-modal";
import { usePortfolioUserPnl } from "./use-portfolio-user-pnl";

const TIME_RANGES: PortfolioTimeRange[] = ["1D", "1W", "1M", "YTD", "All"];

export interface PortfolioPerformanceChartProps {}

export function PortfolioPerformanceChart({}: PortfolioPerformanceChartProps) {
  const t = useTranslations("portfolio");
  const locale = useLocale();
  const { session } = usePortfolioContext();
  const polymarketAddress = session?.funderAddress ?? session?.walletAddress;

  const [range, setRange] = useState<PortfolioTimeRange>("All");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const { series, status } = usePortfolioUserPnl(polymarketAddress, range);

  useEffect(() => {
    setActiveIndex(null);
  }, [range, polymarketAddress]);

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
  const isPositive = displayPnl >= 0;
  const pnlTone = isPositive ? "text-prophet-green" : "text-prophet-red";
  const isLoading = status === "loading";
  const timeLabel =
    activeIndex != null
      ? formatPortfolioPnlHoverTime(displayTimestamp, locale)
      : getPortfolioPnlPeriodLabel(t, range);

  const handleChartMouseMove = (state: { activeTooltipIndex?: number }) => {
    const index = state?.activeTooltipIndex;

    if (typeof index === "number" && index >= 0) {
      setActiveIndex(index);
    }
  };

  return (
    <>
      <div className="flex w-full md:w-1/2 flex-col justify-between gap-4 border-t border-prophet-line pt-6 lg:border-t-0 lg:pl-8 lg:pt-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className={portfolioSummaryLabelClass}>
              <span>{t("profitLoss")}</span>
              <button
                type="button"
                className="border border-prophet-line rounded-[6px] px-[7px] h-[22px] cursor-pointer hover:bg-prophet-panel disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={t("sharePnl")}
                disabled={!polymarketAddress}
                onClick={() => setShareOpen(true)}
              >
                <img
                  src="/icons/icon-share.svg"
                  alt=""
                  className="w-3 h-3 shrink-0"
                  aria-hidden="true"
                />
              </button>
            </span>
            <div className="flex flex-col gap-1">
              <span
                className={cn("text-[32px] font-[500] leading-[38px]", pnlTone)}
              >
                {formatTeamDetailMoney(displayPnl)}
              </span>
              <span className="text-sm text-prophet-muted">{timeLabel}</span>
            </div>
          </div>
          <div
            className="flex shrink-0 gap-4"
            role="tablist"
            aria-label={t("performanceTimeRange")}
          >
            {TIME_RANGES.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={range === item}
                onClick={() => setRange(item)}
                className={cn(
                  "border-0 bg-transparent p-0 text-sm font-[500] leading-[17px] transition-colors",
                  range === item
                    ? "text-prophet-foreground"
                    : "text-prophet-muted hover:text-prophet-foreground",
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
            isLoading && "animate-pulse opacity-60",
          )}
        >
          <PortfolioPnlAreaChart
            series={series}
            isPositive={isPositive}
            onMouseMove={handleChartMouseMove}
            onMouseLeave={() => setActiveIndex(null)}
          />
        </div>
      </div>

      <PortfolioPnlShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        series={series}
        range={range}
        displayPnl={displayPnl}
        funderAddress={polymarketAddress}
      />
    </>
  );
}
