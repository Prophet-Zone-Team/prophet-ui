"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { TabSwitcher } from "@/components/ui/tab-switcher";
import { cn } from "@/lib/cn";
import type { OpenOrderMarketContext } from "@/lib/portfolio/teams-condition";
import type { PortfolioLoadStatus } from "@/lib/portfolio/types";
import type { UserPositionRecord } from "@/types/market";
import { PortfolioPositionsTable } from "@/views/portfolio/portfolio-positions-table";
import { portfolioActivityCardClass } from "@/views/portfolio/portfolio-ui";

const COPY_TRADE_PORTFOLIO_TAB_IDS = ["position", "closed"] as const;

type CopyTradePortfolioTabId =
  (typeof COPY_TRADE_PORTFOLIO_TAB_IDS)[number];

export interface CopyTradePortfolioActivityProps {
  openPositions: UserPositionRecord[];
  closedPositions: UserPositionRecord[];
  marketContextMap: Record<string, OpenOrderMarketContext>;
  positionTimeMap?: Map<string, string>;
  status: PortfolioLoadStatus;
  needsWallet: boolean;
  onConnectWallet: () => void;
  className?: string;
}

export function CopyTradePortfolioActivity({
  openPositions,
  closedPositions,
  marketContextMap,
  positionTimeMap = new Map(),
  status,
  needsWallet,
  onConnectWallet,
  className
}: CopyTradePortfolioActivityProps) {
  const t = useTranslations("copyTrade.portfolio");
  const tPortfolio = useTranslations("portfolio");
  const [tab, setTab] = useState<CopyTradePortfolioTabId>("position");

  const tabs = useMemo(
    () => [
      { id: "position" as const, label: tPortfolio("tabPosition") },
      { id: "closed" as const, label: t("tabClosed") }
    ],
    [t, tPortfolio]
  );

  const positions = tab === "position" ? openPositions : closedPositions;
  const loading = status === "loading" || status === "idle";
  const emptyPositionTitle =
    tab === "position"
      ? tPortfolio("noOpenPositions")
      : t("noClosedPositions");

  return (
    <section
      className={cn(portfolioActivityCardClass, "overflow-hidden", className)}
      aria-label={t("activityAria")}
    >
      <div className="border-b border-[#EBEBEB] px-4 pt-4 md:px-[30px]">
        <TabSwitcher
          items={tabs}
          value={tab}
          onChange={(value) => setTab(value as CopyTradePortfolioTabId)}
          aria-label={t("tabsAria")}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-x-auto py-2 md:py-0">
        {status === "error" ? (
          <p className="px-4 py-8 text-center text-sm text-prophet-muted">
            {t("unableToLoadPositions")}
          </p>
        ) : positions.length === 0 && !loading && !needsWallet ? (
          <p className="px-4 py-8 text-center text-sm text-prophet-muted">
            {emptyPositionTitle}
          </p>
        ) : (
          <PortfolioPositionsTable
            positions={positions}
            marketContextMap={marketContextMap}
            positionTimeMap={positionTimeMap}
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
