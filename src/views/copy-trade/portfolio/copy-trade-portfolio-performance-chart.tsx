"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import {
  COPY_PNL_DISPLAY_RANGES,
  selectCopyPnLSeriesByDisplay,
  type CopyPnLDisplayRange,
} from "@/lib/copy-trade/map-pnl-points";
import { getPortfolioPnlPeriodLabel } from "@/lib/portfolio/portfolio-format";
import { PortfolioPerformanceChartContent } from "@/views/portfolio/portfolio-performance-chart-content";

import { useCopyTradePnLPoints } from "../use-copy-trade-pnl-points";

export interface CopyTradePortfolioPerformanceChartProps {
  enabled?: boolean;
}

export function CopyTradePortfolioPerformanceChart({
  enabled = true,
}: CopyTradePortfolioPerformanceChartProps) {
  const t = useTranslations("copyTrade.portfolio");
  const tPortfolio = useTranslations("portfolio");
  const [range, setRange] = useState<CopyPnLDisplayRange>("All");
  const { pointsResponse, isLoading } = useCopyTradePnLPoints({ enabled });

  const series = useMemo(
    () => selectCopyPnLSeriesByDisplay(pointsResponse, range),
    [pointsResponse, range]
  );

  return (
    <PortfolioPerformanceChartContent<CopyPnLDisplayRange>
      series={series}
      status={isLoading ? "loading" : "ready"}
      range={range}
      onRangeChange={setRange}
      rangeOptions={COPY_PNL_DISPLAY_RANGES}
      defaultRange="All"
      profitLossLabel={t("profitLoss")}
      performanceTimeRangeAriaLabel={t("performanceTimeRange")}
      getRangePeriodLabel={(nextRange) =>
        getPortfolioPnlPeriodLabel(tPortfolio, nextRange)
      }
    />
  );
}
