"use client";

import { useEffect, useRef, useState } from "react";

import { TabSwitcher } from "@/components/ui/tab-switcher";
import type {
  PortfolioLoadStatus,
  UserActivityRecord,
  UserOpenOrder
} from "@/lib/portfolio/types";
import type { TeamMarketSnapshot, UserPositionRecord } from "@/types/market";
import { PortfolioHistoryTable } from "@/views/portfolio/portfolio-history-table";
import { PortfolioOpenOrdersTable } from "@/views/portfolio/portfolio-open-orders-table";
import { PortfolioPositionsTable } from "@/views/portfolio/portfolio-positions-table";
import { portfolioActivityCardClass } from "@/views/portfolio/portfolio-ui";
import type { PortfolioLoadOptions } from "@/views/portfolio/use-portfolio-data";

const PORTFOLIO_TABS = [
  { id: "position", label: "Position" },
  { id: "open-order", label: "Open Order" },
  { id: "history", label: "History" }
] as const;

type PortfolioTabId = (typeof PORTFOLIO_TABS)[number]["id"];

function isTabLoading(status: PortfolioLoadStatus): boolean {
  return status === "loading" || status === "idle";
}

export interface PortfolioActivityTabsProps {
  snapshots: TeamMarketSnapshot[];
  positions: UserPositionRecord[];
  openOrders: UserOpenOrder[];
  activityHistory: UserActivityRecord[];
  positionTimeMap: Map<string, string>;
  sessionConnected: boolean;
  coreStatus: PortfolioLoadStatus;
  openOrdersStatus: PortfolioLoadStatus;
  historyStatus: PortfolioLoadStatus;
  onConnectWallet: () => void;
  loadCore: (options?: PortfolioLoadOptions) => Promise<void>;
  loadOpenOrders: (options?: PortfolioLoadOptions) => Promise<void>;
  loadActivityHistory: (options?: PortfolioLoadOptions) => Promise<void>;
}

export function PortfolioActivityTabs({
  snapshots,
  positions,
  openOrders,
  activityHistory,
  positionTimeMap,
  sessionConnected,
  coreStatus,
  openOrdersStatus,
  historyStatus,
  onConnectWallet,
  loadCore,
  loadOpenOrders,
  loadActivityHistory
}: PortfolioActivityTabsProps) {
  const [tab, setTab] = useState<PortfolioTabId>("position");
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (!sessionConnected) {
      return;
    }

    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (tab === "open-order") {
        void loadOpenOrders();
      } else if (tab === "history") {
        void loadActivityHistory();
      }
      return;
    }

    if (tab === "position") {
      void loadCore({ force: true, silent: true });
    } else if (tab === "open-order") {
      void loadOpenOrders({ force: true });
    } else {
      void loadActivityHistory({ force: true });
    }
  }, [loadActivityHistory, loadCore, loadOpenOrders, sessionConnected, tab]);

  const coreLoading = isTabLoading(coreStatus);
  const needsWallet = !sessionConnected && !coreLoading;

  return (
    <section
      className={portfolioActivityCardClass}
      aria-label="Portfolio activity"
    >
      <div className="shrink-0 overflow-x-auto border-b border-[#EBEBEB] px-3 pt-3 md:px-4">
        <TabSwitcher
          items={[...PORTFOLIO_TABS]}
          value={tab}
          onChange={(value) => setTab(value as PortfolioTabId)}
          aria-label="Portfolio activity"
          size="compact"
          className="min-w-max gap-4 md:gap-6"
        />
      </div>

      {tab === "position" ? (
        <PortfolioPositionsTable
          positions={positions}
          snapshots={snapshots}
          positionTimeMap={positionTimeMap}
          needsWallet={needsWallet}
          loading={coreLoading}
          onConnectWallet={onConnectWallet}
        />
      ) : null}

      {tab === "open-order" ? (
        <PortfolioOpenOrdersTable
          openOrders={openOrders}
          snapshots={snapshots}
          needsWallet={needsWallet}
          loading={sessionConnected && isTabLoading(openOrdersStatus)}
          onConnectWallet={onConnectWallet}
        />
      ) : null}

      {tab === "history" ? (
        <PortfolioHistoryTable
          activityHistory={activityHistory}
          snapshots={snapshots}
          needsWallet={needsWallet}
          loading={sessionConnected && isTabLoading(historyStatus)}
          onConnectWallet={onConnectWallet}
        />
      ) : null}
    </section>
  );
}
