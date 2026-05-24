"use client";

import { useState } from "react";

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

const PORTFOLIO_TABS = [
  { id: "position", label: "Position" },
  { id: "open-order", label: "Open Order" },
  { id: "history", label: "History" }
] as const;

type PortfolioTabId = (typeof PORTFOLIO_TABS)[number]["id"];

export interface PortfolioActivityTabsProps {
  snapshots: TeamMarketSnapshot[];
  positions: UserPositionRecord[];
  openOrders: UserOpenOrder[];
  activityHistory: UserActivityRecord[];
  positionTimeMap: Map<string, string>;
  sessionConnected: boolean;
  status: PortfolioLoadStatus;
  onConnectWallet: () => void;
}

export function PortfolioActivityTabs({
  snapshots,
  positions,
  openOrders,
  activityHistory,
  positionTimeMap,
  sessionConnected,
  status,
  onConnectWallet
}: PortfolioActivityTabsProps) {
  const [tab, setTab] = useState<PortfolioTabId>("position");
  const loading = status === "loading" || status === "idle";
  const needsWallet = !sessionConnected && !loading;

  return (
    <section
      className={portfolioActivityCardClass}
      aria-label="Portfolio activity"
    >
      <div className="shrink-0 border-b border-[#EBEBEB] px-4 pt-3">
        <TabSwitcher
          items={[...PORTFOLIO_TABS]}
          value={tab}
          onChange={(value) => setTab(value as PortfolioTabId)}
          aria-label="Portfolio activity"
          size="compact"
        />
      </div>

      {tab === "position" ? (
        <PortfolioPositionsTable
          positions={positions}
          snapshots={snapshots}
          positionTimeMap={positionTimeMap}
          needsWallet={needsWallet}
          loading={loading}
          onConnectWallet={onConnectWallet}
        />
      ) : null}

      {tab === "open-order" ? (
        <PortfolioOpenOrdersTable
          openOrders={openOrders}
          snapshots={snapshots}
          needsWallet={needsWallet}
          loading={loading}
          onConnectWallet={onConnectWallet}
        />
      ) : null}

      {tab === "history" ? (
        <PortfolioHistoryTable
          activityHistory={activityHistory}
          snapshots={snapshots}
          needsWallet={needsWallet}
          loading={loading}
          onConnectWallet={onConnectWallet}
        />
      ) : null}
    </section>
  );
}
