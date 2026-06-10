"use client";

import type { OpenOrderMarketGroup } from "@/lib/portfolio/group-open-orders";
import type { OpenOrderMarketContext } from "@/lib/portfolio/teams-condition";
import { PortfolioEmptyState } from "@/views/portfolio/portfolio-empty-state";
import { PortfolioOpenOrderMarketCard } from "@/views/portfolio/portfolio-open-order-market-card";
import {
  portfolioConnectButtonClass,
  portfolioTableScrollClass
} from "@/views/portfolio/portfolio-ui";

export interface PortfolioOpenOrdersTableProps {
  marketGroups: OpenOrderMarketGroup[];
  marketContextMap: Record<string, OpenOrderMarketContext>;
  needsWallet: boolean;
  loading: boolean;
  onConnectWallet: () => void;
}

export function PortfolioOpenOrdersTable({
  marketGroups,
  marketContextMap,
  needsWallet,
  loading,
  onConnectWallet
}: PortfolioOpenOrdersTableProps) {
  if (loading) {
    return (
      <p className="px-4 py-8 text-center text-sm text-prophet-muted">
        Loading open orders…
      </p>
    );
  }

  if (needsWallet) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-10">
        <p className="m-0 text-sm text-prophet-muted">
          Connect your wallet to view open orders in your connected account.
        </p>
        <button
          type="button"
          className={portfolioConnectButtonClass}
          onClick={() => void onConnectWallet()}
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (marketGroups.length === 0) {
    return (
      <div className={portfolioTableScrollClass} aria-label="Open orders">
        <PortfolioEmptyState
          title="No open orders"
          body="No open CLOB orders were returned for the connected account."
        />
      </div>
    );
  }

  return (
    <div className={portfolioTableScrollClass} aria-label="Open orders">
      <div className="flex flex-col">
        {marketGroups.map((group) => (
          <PortfolioOpenOrderMarketCard
            key={group.marketId}
            group={group}
            marketContextMap={marketContextMap}
          />
        ))}
      </div>
    </div>
  );
}
