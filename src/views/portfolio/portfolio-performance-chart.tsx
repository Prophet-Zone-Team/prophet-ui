"use client";

// TODO: wire trader PnL API — pass fetched series via seriesOverride
import { useState } from "react";

import type {
  PortfolioSeriesPoint,
  PortfolioTimeRange
} from "@/lib/portfolio/types";
import { usePortfolioContext } from "./context";
import { PortfolioPerformanceChartContent } from "./portfolio-performance-chart-content";
import { usePortfolioUserPnl } from "./use-portfolio-user-pnl";

export interface PortfolioPerformanceChartProps {
  /** When set, skip remote fetch and render with this data. */
  seriesOverride?: PortfolioSeriesPoint[];
  /** Disable remote PnL fetch. Defaults to true when seriesOverride is provided. */
  disableFetch?: boolean;
}

export function PortfolioPerformanceChart({
  seriesOverride,
  disableFetch
}: PortfolioPerformanceChartProps) {
  const isControlled = seriesOverride !== undefined;

  if (isControlled) {
    return <PortfolioPerformanceChartContent series={seriesOverride} />;
  }

  return <PortfolioPerformanceChartConnected disableFetch={disableFetch} />;
}

function PortfolioPerformanceChartConnected({
  disableFetch
}: {
  disableFetch?: boolean;
}) {
  const { session } = usePortfolioContext();
  const polymarketAddress = session?.funderAddress ?? session?.walletAddress;
  const [range, setRange] = useState<PortfolioTimeRange>("All");
  const shouldFetch = disableFetch !== true;
  const { series, status } = usePortfolioUserPnl(
    shouldFetch ? polymarketAddress : undefined,
    range
  );

  return (
    <PortfolioPerformanceChartContent
      series={series}
      status={status}
      range={range}
      onRangeChange={setRange}
    />
  );
}
