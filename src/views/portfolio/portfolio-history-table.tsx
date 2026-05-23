"use client";

import { findSnapshotForTokenId } from "@/lib/portfolio/portfolio-metrics";
import {
  formatPortfolioDateTime,
  formatSharePrice,
  titleCase
} from "@/lib/portfolio/portfolio-format";
import { formatShareSize } from "@/lib/market/order-math";
import type { TeamMarketSnapshot, UserOrderRecord } from "@/types/market";
import { TeamFlag } from "@/components/teams/team-flag";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import { PortfolioEmptyState } from "@/views/portfolio/portfolio-empty-state";
import {
  portfolioHistoryTableRowClass,
  portfolioConnectButtonClass,
  portfolioOrdersTableRowClass,
  portfolioTableScrollClass
} from "@/views/portfolio/portfolio-ui";

export interface PortfolioHistoryTableProps {
  orderHistory: UserOrderRecord[];
  snapshots: TeamMarketSnapshot[];
  needsWallet: boolean;
  loading: boolean;
  onConnectWallet: () => void;
  embedded?: boolean;
}

export function PortfolioHistoryTable({
  orderHistory,
  snapshots,
  needsWallet,
  loading,
  onConnectWallet,
  embedded = false
}: PortfolioHistoryTableProps) {
  if (loading) {
    return (
      <p className="px-4 py-8 text-center text-sm text-prophet-muted">Loading order history…</p>
    );
  }

  if (needsWallet) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-10">
        <p className="m-0 text-sm text-prophet-muted">
          Connect your wallet to view order history in your connected account.
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

  if (orderHistory.length === 0) {
    return (
      <PortfolioEmptyState
        title="No order history"
        body="Submitted orders will appear here after you place trades from your connected account."
      />
    );
  }

  const rows = orderHistory.map((order) => {
        const snapshot = findSnapshotForTokenId(order.preview.tokenId, snapshots);
        const sideLabel = titleCase(order.preview.side);
        const timeValue = order.updatedAt ?? order.submittedAt ?? "";

        return (
          <div key={order.id} className={portfolioHistoryTableRowClass}>
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
                  {snapshot?.team.name ?? order.preview.teamId.toUpperCase()}
                </p>
                <p className="m-0 mt-0.5 text-xs text-prophet-muted">
                  {order.preview.outcome.toUpperCase()}
                </p>
              </div>
            </div>
            <span className="font-[556]">
              {sideLabel} {formatSharePrice(order.preview.limitPrice)}
            </span>
            <span>{formatShareSize(order.preview.size)}</span>
            <span className="capitalize text-prophet-muted">
              {order.status.replace(/_/g, " ")}
            </span>
            <span className="font-[556]">
              {order.preview.estimatedTotalCost !== undefined
                ? formatTeamDetailMoney(order.preview.estimatedTotalCost)
                : "—"}
            </span>
            <span className="text-prophet-muted">
              {timeValue ? formatPortfolioDateTime(timeValue) : "—"}
            </span>
          </div>
        );
      });

  if (embedded) {
    return <>{rows}</>;
  }

  return <div className={portfolioTableScrollClass}>{rows}</div>;
}
