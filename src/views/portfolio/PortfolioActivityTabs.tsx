"use client";

import { useState } from "react";

import { TabSwitcher } from "../../components/ui/TabSwitcher";
import type { UserOpenOrder, PortfolioLoadStatus } from "../../lib/portfolio/types";
import type { TeamMarketSnapshot, UserOrderRecord, UserPositionRecord } from "../../types/market";
import { PortfolioHistoryTable } from "./PortfolioHistoryTable";
import { PortfolioOpenOrdersTable } from "./PortfolioOpenOrdersTable";
import { PortfolioPositionsTable } from "./PortfolioPositionsTable";
import {
  portfolioHistoryTableHeadClass,
  portfolioOrdersTableHeadClass,
  portfolioPositionsTableHeadClass,
  portfolioActivityCardClass,
  portfolioTableScrollClass
} from "./portfolioUi";

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
  orderHistory: UserOrderRecord[];
  positionTimeMap: Map<string, string>;
  sessionConnected: boolean;
  status: PortfolioLoadStatus;
  onConnectWallet: () => void;
}

export function PortfolioActivityTabs({
  snapshots,
  positions,
  openOrders,
  orderHistory,
  positionTimeMap,
  sessionConnected,
  status,
  onConnectWallet
}: PortfolioActivityTabsProps) {
  const [tab, setTab] = useState<PortfolioTabId>("position");
  const loading = status === "loading" || status === "idle";
  const needsWallet = !sessionConnected && !loading;

  return (
    <section className={portfolioActivityCardClass} aria-label="Portfolio activity">
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
        <div className={portfolioTableScrollClass} aria-label="Your positions">
          <div className={portfolioPositionsTableHeadClass}>
            <span>Market</span>
            <span>Traded</span>
            <span>To Win</span>
            <span>Value</span>
            <span>Time</span>
            <span className="sr-only">Action</span>
          </div>
          <PortfolioPositionsTable
            positions={positions}
            snapshots={snapshots}
            positionTimeMap={positionTimeMap}
            needsWallet={needsWallet}
            loading={loading}
            onConnectWallet={onConnectWallet}
            embedded
          />
        </div>
      ) : null}

      {tab === "open-order" ? (
        <div className={portfolioTableScrollClass} aria-label="Open orders">
          <div className={portfolioOrdersTableHeadClass}>
            <span>Market</span>
            <span>Side / Price</span>
            <span>Size</span>
            <span>Filled</span>
            <span>Time</span>
            <span className="sr-only">Action</span>
          </div>
          <PortfolioOpenOrdersTable
            openOrders={openOrders}
            snapshots={snapshots}
            needsWallet={needsWallet}
            loading={loading}
            onConnectWallet={onConnectWallet}
            embedded
          />
        </div>
      ) : null}

      {tab === "history" ? (
        <div className={portfolioTableScrollClass} aria-label="Order history">
          <div className={portfolioHistoryTableHeadClass}>
            <span>Market</span>
            <span>Side / Price</span>
            <span>Size</span>
            <span>Status</span>
            <span>Cost</span>
            <span>Time</span>
          </div>
          <PortfolioHistoryTable
            orderHistory={orderHistory}
            snapshots={snapshots}
            needsWallet={needsWallet}
            loading={loading}
            onConnectWallet={onConnectWallet}
            embedded
          />
        </div>
      ) : null}
    </section>
  );
}
