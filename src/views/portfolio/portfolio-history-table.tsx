"use client";

import type { ReactNode } from "react";

import { TeamFlag } from "@/components/teams/team-flag";
import { findSnapshotForTokenId } from "@/lib/portfolio/portfolio-metrics";
import {
  formatPortfolioDateTime,
  formatSharePrice,
  titleCase
} from "@/lib/portfolio/portfolio-format";
import type { UserActivityRecord } from "@/lib/portfolio/types";
import { formatShareSize } from "@/lib/market/order-math";
import type { TeamMarketSnapshot } from "@/types/market";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import { PortfolioEmptyState } from "@/views/portfolio/portfolio-empty-state";
import { PortfolioTableMobileField } from "@/views/portfolio/portfolio-table-mobile";
import {
  portfolioConnectButtonClass,
  portfolioHistoryTableHeadClass,
  portfolioHistoryTableRowClass,
  portfolioTableDesktopScrollClass,
  portfolioTableMobileCardClass,
  portfolioTableMobileListClass,
  portfolioTableScrollClass
} from "@/views/portfolio/portfolio-ui";

export interface PortfolioHistoryTableProps {
  activityHistory: UserActivityRecord[];
  snapshots: TeamMarketSnapshot[];
  needsWallet: boolean;
  loading: boolean;
  onConnectWallet: () => void;
}

function PortfolioHistoryTableHeader() {
  return (
    <div className={portfolioHistoryTableHeadClass}>
      <span>Market</span>
      <span>Side / Price</span>
      <span>Size</span>
      <span>Status</span>
      <span>Cost</span>
      <span>Time</span>
    </div>
  );
}

function HistoryMarketCell({
  activity,
  snapshot
}: {
  activity: UserActivityRecord;
  snapshot?: TeamMarketSnapshot;
}) {
  return (
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
        <p className="m-0 truncate font-[400] text-black">
          {snapshot?.team.name ?? activity.title}
        </p>
        <p className="m-0 mt-0.5 text-xs text-prophet-muted">
          {activity.outcome.toUpperCase()}
        </p>
      </div>
    </div>
  );
}

export function PortfolioHistoryTable({
  activityHistory,
  snapshots,
  needsWallet,
  loading,
  onConnectWallet
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

  if (activityHistory.length === 0) {
    return (
      <div className={portfolioTableScrollClass} aria-label="Order history">
        <div className={portfolioTableDesktopScrollClass}>
          <PortfolioHistoryTableHeader />
        </div>
        <PortfolioEmptyState
          title="No order history"
          body="Trade activity from your connected Polymarket account will appear here."
        />
      </div>
    );
  }

  const desktopRows: ReactNode[] = [];
  const mobileCards: ReactNode[] = [];

  activityHistory.forEach((activity) => {
    const snapshot = findSnapshotForTokenId(activity.asset, snapshots);
    const sideLabel = titleCase(activity.side.toLowerCase());
    const timeValue = new Date(activity.timestamp * 1000).toISOString();
    const sidePriceLabel = `${sideLabel} ${formatSharePrice(activity.price)}`;

    desktopRows.push(
      <div key={activity.id} className={portfolioHistoryTableRowClass}>
        <HistoryMarketCell activity={activity} snapshot={snapshot} />
        <span className="font-[400]">{sidePriceLabel}</span>
        <span>{formatShareSize(activity.size)}</span>
        <span className="capitalize text-prophet-muted">Trade</span>
        <span className="font-[556]">
          {formatTeamDetailMoney(activity.usdcSize)}
        </span>
        <span className="text-prophet-muted">
          {formatPortfolioDateTime(timeValue)}
        </span>
      </div>
    );

    mobileCards.push(
      <article key={`${activity.id}-mobile`} className={portfolioTableMobileCardClass}>
        <HistoryMarketCell activity={activity} snapshot={snapshot} />
        <PortfolioTableMobileField label="Side / Price" valueClassName="font-normal">
          {sidePriceLabel}
        </PortfolioTableMobileField>
        <PortfolioTableMobileField label="Size">
          {formatShareSize(activity.size)}
        </PortfolioTableMobileField>
        <PortfolioTableMobileField
          label="Status"
          valueClassName="font-normal capitalize text-prophet-muted"
        >
          Trade
        </PortfolioTableMobileField>
        <PortfolioTableMobileField label="Cost">
          {formatTeamDetailMoney(activity.usdcSize)}
        </PortfolioTableMobileField>
        <PortfolioTableMobileField
          label="Time"
          valueClassName="font-normal text-prophet-muted"
        >
          {formatPortfolioDateTime(timeValue)}
        </PortfolioTableMobileField>
      </article>
    );
  });

  return (
    <div className={portfolioTableScrollClass} aria-label="Order history">
      <div className={portfolioTableDesktopScrollClass}>
        <PortfolioHistoryTableHeader />
        {desktopRows}
      </div>
      <div className={portfolioTableMobileListClass}>{mobileCards}</div>
    </div>
  );
}
