"use client";

import { useState } from "react";

import { TabSwitcher } from "@/components/ui/tab-switcher";
import { cn } from "@/lib/cn";
import type { OpenOrderMarketContext } from "@/lib/portfolio/teams-condition";
import type { PortfolioLoadStatus } from "@/lib/portfolio/types";
import type { UserPositionRecord } from "@/types/market";
import { PortfolioPositionsTable } from "@/views/portfolio/portfolio-positions-table";
import { portfolioActivityCardClass } from "@/views/portfolio/portfolio-ui";

const COPY_TRADE_PORTFOLIO_TABS = [
  { id: "position", label: "Position" },
  { id: "closed", label: "Closed" }
] as const;

type CopyTradePortfolioTabId =
  (typeof COPY_TRADE_PORTFOLIO_TABS)[number]["id"];

export interface CopyTradePortfolioActivityProps {
  openPositions: UserPositionRecord[];
  closedPositions: UserPositionRecord[];
  marketContextMap: Record<string, OpenOrderMarketContext>;
  status: PortfolioLoadStatus;
  needsWallet: boolean;
  onConnectWallet: () => void;
  className?: string;
}

export function CopyTradePortfolioActivity({
  openPositions,
  closedPositions,
  marketContextMap,
  status,
  needsWallet,
  onConnectWallet,
  className
}: CopyTradePortfolioActivityProps) {
  const [tab, setTab] = useState<CopyTradePortfolioTabId>("position");
  const positions = tab === "position" ? openPositions : closedPositions;
  const loading = status === "loading" || status === "idle";
  const emptyPositionTitle =
    tab === "position" ? "No open positions" : "No closed positions";

  return (
    <section
      className={cn(portfolioActivityCardClass, "overflow-hidden", className)}
      aria-label="Copy trade portfolio activity"
    >
      <div className="border-b border-[#EBEBEB] px-4 pt-4 md:px-[30px]">
        <TabSwitcher
          items={COPY_TRADE_PORTFOLIO_TABS.map((item) => ({
            id: item.id,
            label: item.label
          }))}
          value={tab}
          onChange={(value) => setTab(value as CopyTradePortfolioTabId)}
          aria-label="Copy trade portfolio tabs"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-x-auto py-2 md:py-0">
        {status === "error" ? (
          <p className="px-4 py-8 text-center text-sm text-prophet-muted">
            Unable to load positions.
          </p>
        ) : positions.length === 0 && !loading && !needsWallet ? (
          <p className="px-4 py-8 text-center text-sm text-prophet-muted">
            {emptyPositionTitle}
          </p>
        ) : (
          <PortfolioPositionsTable
            positions={positions}
            marketContextMap={marketContextMap}
            positionTimeMap={new Map()}
            needsWallet={needsWallet}
            loading={loading}
            readOnly
            onConnectWallet={onConnectWallet}
          />
        )}
      </div>
    </section>
  );
}
