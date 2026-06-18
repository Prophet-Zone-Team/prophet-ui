"use client";

import { useEffect, useMemo } from "react";

import { trackPortfolioViewed } from "@/lib/analytics/tracking";

import { useAuth } from "@/context/auth";
import { buildPortfolioView } from "@/lib/portfolio/portfolio-metrics";
import { PortfolioActivityTabs } from "@/views/portfolio/portfolio-activity-tabs";
import { PortfolioSummarySection } from "@/views/portfolio/portfolio-summary-section";
import { portfolioPageClass } from "@/views/portfolio/portfolio-ui";
import { usePortfolioData } from "@/views/portfolio/use-portfolio-data";
import { PortfolioProvider } from "./context";

export function PortfolioView() {
  useEffect(() => {
    trackPortfolioViewed();
  }, []);

  const { cash } = useAuth();
  const {
    session,
    positions,
    comboPositions,
    openOrders,
    marketContextMap,
    transactions,
    historyHasMore,
    historyLoadingMore,
    coreStatus,
    openOrdersStatus,
    historyStatus,
    connectWallet,
    reload,
    removeOpenOrder,
    removeOpenOrders,
    removeOpenOrdersByMarket,
    loadCore,
    loadOpenOrders,
    loadActivityHistory,
    loadMoreActivityHistory
  } = usePortfolioData();

  const portfolio = useMemo(
    () =>
      buildPortfolioView({
        positions,
        cash,
        transactions
      }),
    [cash, positions, transactions]
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
        removeOpenOrders,
        removeOpenOrdersByMarket,
        coreStatus
      }}
    >
      <section className={portfolioPageClass}>
        <div className="flex flex-col gap-4">
          <PortfolioSummarySection />

          <PortfolioActivityTabs
            marketContextMap={marketContextMap}
            positions={positions}
            comboPositions={comboPositions}
            openOrders={openOrders}
            transactions={transactions}
            historyHasMore={historyHasMore}
            historyLoadingMore={historyLoadingMore}
            positionTimeMap={portfolio.positionTimeMap}
            sessionConnected={Boolean(session)}
            coreStatus={coreStatus}
            openOrdersStatus={openOrdersStatus}
            historyStatus={historyStatus}
            onConnectWallet={() => void connectWallet()}
            loadCore={loadCore}
            loadOpenOrders={loadOpenOrders}
            loadActivityHistory={loadActivityHistory}
            loadMoreActivityHistory={loadMoreActivityHistory}
          />
        </div>
      </section>
    </PortfolioProvider>
  );
}
