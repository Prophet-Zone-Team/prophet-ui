"use client";

import { useMemo } from "react";

import { useAuth } from "@/context/auth";
import { buildPortfolioView } from "@/lib/portfolio/portfolio-metrics";
import { PortfolioActivityTabs } from "@/views/portfolio/portfolio-activity-tabs";
import { PortfolioSummarySection } from "@/views/portfolio/portfolio-summary-section";
import { portfolioPageClass } from "@/views/portfolio/portfolio-ui";
import { usePortfolioData } from "@/views/portfolio/use-portfolio-data";
import { PortfolioProvider } from "./context";

export function PortfolioView() {
  const { cash } = useAuth();
  const {
    session,
    positions,
    openOrders,
    marketContextMap,
    transactions,
    historyPage,
    historyTotal,
    historyPageSize,
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
    setHistoryPage
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
            openOrders={openOrders}
            transactions={transactions}
            historyPage={historyPage}
            historyTotal={historyTotal}
            historyPageSize={historyPageSize}
            positionTimeMap={portfolio.positionTimeMap}
            sessionConnected={Boolean(session)}
            coreStatus={coreStatus}
            openOrdersStatus={openOrdersStatus}
            historyStatus={historyStatus}
            onConnectWallet={() => void connectWallet()}
            onHistoryPageChange={setHistoryPage}
            loadCore={loadCore}
            loadOpenOrders={loadOpenOrders}
            loadActivityHistory={loadActivityHistory}
          />
        </div>
      </section>
    </PortfolioProvider>
  );
}
