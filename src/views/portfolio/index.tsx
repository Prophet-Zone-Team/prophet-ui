"use client";

import { useMemo } from "react";

import type { MarketDataMeta } from "@/data/providers/types";
import { useAuth } from "@/context/auth";
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
  const { cash } = useAuth();
  const {
    session,
    positions,
    openOrders,
    activityHistory,
    coreStatus,
    openOrdersStatus,
    historyStatus,
    connectWallet,
    reload,
    removeOpenOrder,
    loadCore,
    loadOpenOrders,
    loadActivityHistory
  } = usePortfolioData();

  const portfolio = useMemo(
    () =>
      buildPortfolioView({
        positions,
        snapshots,
        cash,
        activityHistory
      }),
    [activityHistory, cash, positions, snapshots]
  );

  return (
    <PortfolioProvider
      value={{
        session,
        portfolio,
        status: coreStatus,
        onConnectWallet: () => void connectWallet(),
        reload,
        removeOpenOrder,
        coreStatus
      }}
    >
      <section className={portfolioPageClass}>
        <div className="flex flex-col gap-4">
          <PortfolioSummarySection />

          <PortfolioActivityTabs
            snapshots={snapshots}
            positions={positions}
            openOrders={openOrders}
            activityHistory={activityHistory}
            positionTimeMap={portfolio.positionTimeMap}
            sessionConnected={Boolean(session)}
            coreStatus={coreStatus}
            openOrdersStatus={openOrdersStatus}
            historyStatus={historyStatus}
            onConnectWallet={() => void connectWallet()}
            loadCore={loadCore}
            loadOpenOrders={loadOpenOrders}
            loadActivityHistory={loadActivityHistory}
          />
        </div>
      </section>
    </PortfolioProvider>
  );
}
