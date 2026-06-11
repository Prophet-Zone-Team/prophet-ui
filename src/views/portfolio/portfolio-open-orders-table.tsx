"use client";

import { useTranslations } from "next-intl";

import type { OpenOrderMarketGroup } from "@/lib/portfolio/group-open-orders";
import type { OpenOrderMarketContext } from "@/lib/portfolio/teams-condition";
import { PortfolioEmptyState } from "@/views/portfolio/portfolio-empty-state";
import { PortfolioOpenOrderMarketCard } from "@/views/portfolio/portfolio-open-order-market-card";
import {
  portfolioConnectButtonClass,
  portfolioOrdersTableHeadClass,
  portfolioTableDesktopScrollClass,
  portfolioTableMobileListClass,
  portfolioTableScrollClass
} from "@/views/portfolio/portfolio-ui";

export interface PortfolioOpenOrdersTableProps {
  marketGroups: OpenOrderMarketGroup[];
  marketContextMap: Record<string, OpenOrderMarketContext>;
  needsWallet: boolean;
  loading: boolean;
  onConnectWallet: () => void;
}

function PortfolioOpenOrdersTableHeader() {
  const t = useTranslations("portfolio");

  return (
    <div className={portfolioOrdersTableHeadClass}>
      <span>{t("market")}</span>
      <span>{t("filled")}</span>
      <span>{t("total")}</span>
      <span>{t("expiration")}</span>
      <span className="justify-self-end text-right">{t("action")}</span>
    </div>
  );
}

export function PortfolioOpenOrdersTable({
  marketGroups,
  marketContextMap,
  needsWallet,
  loading,
  onConnectWallet
}: PortfolioOpenOrdersTableProps) {
  const t = useTranslations("portfolio");

  if (loading) {
    return (
      <p className="px-4 py-8 text-center text-sm text-prophet-muted">
        {t("loadingOpenOrders")}
      </p>
    );
  }

  if (needsWallet) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-10">
        <p className="m-0 text-sm text-prophet-muted">
          {t("connectWalletToViewOpenOrders")}
        </p>
        <button
          type="button"
          className={portfolioConnectButtonClass}
          onClick={() => void onConnectWallet()}
        >
          {t("connectWallet")}
        </button>
      </div>
    );
  }

  if (marketGroups.length === 0) {
    return (
      <div className={portfolioTableScrollClass} aria-label={t("openOrders")}>
        <div className={portfolioTableDesktopScrollClass}>
          <PortfolioOpenOrdersTableHeader />
        </div>
        <PortfolioEmptyState
          title={t("noOpenOrders")}
          body={t("noOpenOrdersBody")}
        />
      </div>
    );
  }

  return (
    <div className={portfolioTableScrollClass} aria-label={t("openOrders")}>
      <div className={portfolioTableDesktopScrollClass}>
        <PortfolioOpenOrdersTableHeader />
        {marketGroups.map((group) => (
          <PortfolioOpenOrderMarketCard
            key={group.marketId}
            group={group}
            marketContextMap={marketContextMap}
            layout="desktop"
          />
        ))}
      </div>
      <div className={portfolioTableMobileListClass}>
        {marketGroups.map((group) => (
          <PortfolioOpenOrderMarketCard
            key={`${group.marketId}-mobile`}
            group={group}
            marketContextMap={marketContextMap}
            layout="mobile"
          />
        ))}
      </div>
    </div>
  );
}
