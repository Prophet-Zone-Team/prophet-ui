"use client";

import { useMemo } from "react";

import type { MarketDataMeta } from "@/data/providers/types";
import { buildPortfolioView } from "@/lib/portfolio/portfolio-metrics";
import type { TeamMarketSnapshot } from "@/types/market";
import { PortfolioActivityTabs } from "@/views/portfolio/portfolio-activity-tabs";
import { PortfolioSummarySection } from "@/views/portfolio/portfolio-summary-section";
import { portfolioPageClass } from "@/views/portfolio/portfolio-ui";
import { usePortfolioData } from "@/views/portfolio/use-portfolio-data";
import { PortfolioProvider } from "./context";

export interface PortfolioViewProps {
  snapshots: TeamMarketSnapshot[];
  dataStatus: MarketDataMeta;
}

export function PortfolioView({ snapshots }: PortfolioViewProps) {
  const {
    session,
    positions,
    openOrders,
    activityHistory,
    readiness,
    status,
    message,
    connectWallet,
    reload,
    removeOpenOrder,
  } = usePortfolioData();

  const portfolio = useMemo(
    () =>
      buildPortfolioView({
        positions,
        snapshots,
        readiness,
        activityHistory
      }),
    [activityHistory, positions, readiness, snapshots]
  );

  return (
    <PortfolioProvider
      value={{
        session,
        portfolio,
        status,
        onConnectWallet: () => void connectWallet(),
        reload,
        removeOpenOrder,
      }}
    >
      <section className={portfolioPageClass}>
        <div className="flex flex-col gap-4">
          <PortfolioSummarySection />

          {message ? (
            <p
              className={
                status === "error"
                  ? "m-0 text-sm text-prophet-red"
                  : "m-0 text-sm text-prophet-muted"
              }
            >
              {message}
            </p>
          ) : null}

          <PortfolioActivityTabs
            snapshots={snapshots}
            positions={positions}
            openOrders={openOrders}
            activityHistory={activityHistory}
            positionTimeMap={portfolio.positionTimeMap}
            sessionConnected={Boolean(session)}
            status={status}
            onConnectWallet={() => void connectWallet()}
          />
        </div>
      </section>
    </PortfolioProvider>
  );
}
