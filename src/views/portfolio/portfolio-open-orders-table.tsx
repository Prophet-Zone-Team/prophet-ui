"use client";

import { useState, type ReactNode } from "react";

import { RegionRestrictedControl } from "@/components/trading/region-restricted-control";
import { TeamFlag } from "@/components/teams/team-flag";
import { useAuth } from "@/context/auth";
import { cn } from "@/lib/cn";
import { findSnapshotForTokenId } from "@/lib/portfolio/portfolio-metrics";
import {
  formatSharePrice,
  formatUnixSeconds,
  titleCase
} from "@/lib/portfolio/portfolio-format";
import type { UserOpenOrder } from "@/lib/portfolio/types";
import { formatShareSize } from "@/lib/market/order-math";
import type { TeamMarketSnapshot } from "@/types/market";
import { PortfolioEmptyState } from "@/views/portfolio/portfolio-empty-state";
import { PortfolioOpenOrderCancelDialog } from "@/views/portfolio/portfolio-open-order-cancel-dialog";
import { PortfolioTableMobileField } from "@/views/portfolio/portfolio-table-mobile";
import {
  portfolioActionButtonClass,
  portfolioConnectButtonClass,
  portfolioOrdersTableHeadClass,
  portfolioOrdersTableRowClass,
  portfolioTableDesktopScrollClass,
  portfolioTableMobileCardClass,
  portfolioTableMobileListClass,
  portfolioTableScrollClass
} from "@/views/portfolio/portfolio-ui";

export interface PortfolioOpenOrdersTableProps {
  openOrders: UserOpenOrder[];
  snapshots: TeamMarketSnapshot[];
  needsWallet: boolean;
  loading: boolean;
  onConnectWallet: () => void;
}

type CancelTarget = {
  order: UserOpenOrder;
  snapshot?: TeamMarketSnapshot;
};

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

function PortfolioOpenOrdersTableHeader() {
  return (
    <div className={portfolioOrdersTableHeadClass}>
      <span>Market</span>
      <span>Side / Price</span>
      <span>Size</span>
      <span>Filled</span>
      <span>Time</span>
      <span
        aria-hidden="true"
        className={cn(
          portfolioActionButtonClass,
          "invisible pointer-events-none justify-self-end"
        )}
      >
        Cancel
      </span>
    </div>
  );
}

function OpenOrderMarketCell({
  order,
  snapshot
}: {
  order: UserOpenOrder;
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
        <p className="m-0 truncate font-[556] text-black">
          {order.outcome || order.market || order.asset_id}
        </p>
      </div>
    </div>
  );
}

export function PortfolioOpenOrdersTable({
  openOrders,
  snapshots,
  needsWallet,
  loading,
  onConnectWallet
}: PortfolioOpenOrdersTableProps) {
  const [cancelTarget, setCancelTarget] = useState<CancelTarget | null>(null);
  const { isRegionBlocked } = useAuth();
  const regionRestricted = isRegionBlocked;

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
      <div className={portfolioTableScrollClass} aria-label="Open orders">
        <div className={portfolioTableDesktopScrollClass}>
          <PortfolioOpenOrdersTableHeader />
        </div>
        <PortfolioEmptyState
          title="No open orders"
          body="No open CLOB orders were returned for the connected account."
        />
      </div>
    );
  }

  const desktopRows: ReactNode[] = [];
  const mobileCards: ReactNode[] = [];

  openOrders.forEach((order) => {
    const snapshot = findSnapshotForTokenId(order.asset_id, snapshots);
    const price = Number(order.price);
    const sideLabel = titleCase(order.side);
    const sidePriceLabel = `${sideLabel} ${
      Number.isFinite(price) ? formatSharePrice(price) : order.price
    }`;

    const cancelButton = (
      <RegionRestrictedControl restricted={regionRestricted}>
        <button
          type="button"
          className={cn(
            portfolioActionButtonClass,
            "w-full md:w-auto md:justify-self-end",
            "disabled:opacity-50"
          )}
          disabled={regionRestricted}
          onClick={() => {
            if (!regionRestricted) {
              setCancelTarget({ order, snapshot: snapshot ?? undefined });
            }
          }}
        >
          Cancel
        </button>
      </RegionRestrictedControl>
    );

    desktopRows.push(
      <div key={order.id} className={portfolioOrdersTableRowClass}>
        <OpenOrderMarketCell order={order} snapshot={snapshot} />
        <span className="font-[556]">{sidePriceLabel}</span>
        <span>{formatShareSize(getRemainingSize(order))}</span>
        <span className="text-prophet-muted">{getFilledPercent(order)}</span>
        <span className="text-prophet-muted">
          {formatUnixSeconds(order.created_at)}
        </span>
        {cancelButton}
      </div>
    );

    mobileCards.push(
      <article key={`${order.id}-mobile`} className={portfolioTableMobileCardClass}>
        <OpenOrderMarketCell order={order} snapshot={snapshot} />
        <PortfolioTableMobileField label="Side / Price">{sidePriceLabel}</PortfolioTableMobileField>
        <PortfolioTableMobileField label="Size">
          {formatShareSize(getRemainingSize(order))}
        </PortfolioTableMobileField>
        <PortfolioTableMobileField
          label="Filled"
          valueClassName="font-normal text-prophet-muted"
        >
          {getFilledPercent(order)}
        </PortfolioTableMobileField>
        <PortfolioTableMobileField
          label="Time"
          valueClassName="font-normal text-prophet-muted"
        >
          {formatUnixSeconds(order.created_at)}
        </PortfolioTableMobileField>
        {cancelButton}
      </article>
    );
  });

  return (
    <>
      <div className={portfolioTableScrollClass} aria-label="Open orders">
        <div className={portfolioTableDesktopScrollClass}>
          <PortfolioOpenOrdersTableHeader />
          {desktopRows}
        </div>
        <div className={portfolioTableMobileListClass}>{mobileCards}</div>
      </div>

      {cancelTarget ? (
        <PortfolioOpenOrderCancelDialog
          open
          order={cancelTarget.order}
          snapshot={cancelTarget.snapshot}
          onClose={() => setCancelTarget(null)}
        />
      ) : null}
    </>
  );
}
