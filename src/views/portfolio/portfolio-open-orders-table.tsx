"use client";

import { findSnapshotForTokenId } from "@/lib/portfolio/portfolio-metrics";
import {
  formatSharePrice,
  formatUnixSeconds,
  titleCase
} from "@/lib/portfolio/portfolio-format";
import type { UserOpenOrder } from "@/lib/portfolio/types";
import { formatShareSize } from "@/lib/market/order-math";
import type { TeamMarketSnapshot } from "@/types/market";
import { TeamFlag } from "@/components/teams/team-flag";
import { PortfolioEmptyState } from "@/views/portfolio/portfolio-empty-state";
import {
  portfolioActionButtonClass,
  portfolioConnectButtonClass,
  portfolioOrdersTableRowClass,
  portfolioTableScrollClass
} from "@/views/portfolio/portfolio-ui";

export interface PortfolioOpenOrdersTableProps {
  openOrders: UserOpenOrder[];
  snapshots: TeamMarketSnapshot[];
  needsWallet: boolean;
  loading: boolean;
  onConnectWallet: () => void;
  embedded?: boolean;
}

function getRemainingSize(order: UserOpenOrder): number {
  const original = Number(order.original_size);
  const matched = Number(order.size_matched);

  if (!Number.isFinite(original)) {
    return 0;
  }

  return Math.max(0, original - (Number.isFinite(matched) ? matched : 0));
}

function getFilledPercent(order: UserOpenOrder): string {
  const original = Number(order.original_size);
  const matched = Number(order.size_matched);

  if (!Number.isFinite(original) || original <= 0) {
    return "0%";
  }

  const percent = ((Number.isFinite(matched) ? matched : 0) / original) * 100;
  return `${percent.toFixed(0)}%`;
}

export function PortfolioOpenOrdersTable({
  openOrders,
  snapshots,
  needsWallet,
  loading,
  onConnectWallet,
  embedded = false
}: PortfolioOpenOrdersTableProps) {
  if (loading) {
    return (
      <p className="px-4 py-8 text-center text-sm text-prophet-muted">Loading open orders…</p>
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

  if (openOrders.length === 0) {
    return (
      <PortfolioEmptyState
        title="No open orders"
        body="No open CLOB orders were returned for the connected account."
      />
    );
  }

  const rows = openOrders.map((order) => {
        const snapshot = findSnapshotForTokenId(order.asset_id, snapshots);
        const price = Number(order.price);
        const sideLabel = titleCase(order.side);

        return (
          <div key={order.id} className={portfolioOrdersTableRowClass}>
            <div className="flex min-w-0 items-start gap-2">
              {snapshot ? (
                <TeamFlag code={snapshot.team.code} name={snapshot.team.name} />
              ) : (
                <span
                  className="flex size-5 shrink-0 items-center justify-center rounded-full bg-prophet-line text-[10px] text-prophet-muted"
                  aria-hidden="true"
                >
                  ?
                </span>
              )}
              <div className="min-w-0">
                <p className="m-0 truncate font-[556] text-black">
                  {order.outcome || order.market || order.asset_id}
                </p>
              </div>
            </div>
            <span className="font-[556]">
              {sideLabel}{" "}
              {Number.isFinite(price) ? formatSharePrice(price) : order.price}
            </span>
            <span>{formatShareSize(getRemainingSize(order))}</span>
            <span className="text-prophet-muted">{getFilledPercent(order)}</span>
            <span className="text-prophet-muted">{formatUnixSeconds(order.created_at)}</span>
            <button
              type="button"
              className={portfolioActionButtonClass}
              disabled
              title="Coming soon"
            >
              Cancel
            </button>
          </div>
        );
      });

  if (embedded) {
    return <>{rows}</>;
  }

  return <div className={portfolioTableScrollClass}>{rows}</div>;
}
