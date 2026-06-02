"use client";

import { useState, type ReactNode } from "react";

import { RegionRestrictedControl } from "@/components/trading/region-restricted-control";
import { useAuth } from "@/context/auth";
import { cn } from "@/lib/cn";
import {
  formatPortfolioDateTime,
  formatPnlSubline,
  formatSharePrice
} from "@/lib/portfolio/portfolio-format";
import {
  canRedeemPosition,
  findSnapshotForConditionId,
  findSnapshotForPosition,
  findSnapshotForTokenId,
  getPortfolioMarketClosedDisabledReason,
  isAuthoritativeSnapshotForPosition
} from "@/lib/portfolio/portfolio-metrics";
import { resolveTradeHref } from "@/lib/routes/trade";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import { useTradeTicketStore } from "@/store/trade-ticket-store";
import type { TeamMarketSnapshot, UserPositionRecord } from "@/types/market";
import { PortfolioEmptyState } from "@/views/portfolio/portfolio-empty-state";
import { PortfolioMarketCell } from "@/views/portfolio/portfolio-market-cell";
import { PortfolioPositionRedeemDialog } from "@/views/portfolio/portfolio-position-redeem-dialog";
import { PortfolioPositionSellDialog } from "@/views/portfolio/portfolio-position-sell-dialog";
import { PortfolioTableMobileField } from "@/views/portfolio/portfolio-table-mobile";
import {
  portfolioActionButtonClass,
  portfolioConnectButtonClass,
  portfolioPositionsTableHeadClass,
  portfolioPositionsTableRowClass,
  portfolioTableDesktopScrollClass,
  portfolioTableMobileCardClass,
  portfolioTableMobileListClass,
  portfolioTableScrollClass
} from "@/views/portfolio/portfolio-ui";

export interface PortfolioPositionsTableProps {
  positions: UserPositionRecord[];
  snapshots: TeamMarketSnapshot[];
  positionTimeMap: Map<string, string>;
  needsWallet: boolean;
  loading: boolean;
  onConnectWallet: () => void;
}

type SellTarget = {
  position: UserPositionRecord;
  snapshot: TeamMarketSnapshot;
};

type RedeemTarget = {
  position: UserPositionRecord;
  snapshot?: TeamMarketSnapshot;
};

function PortfolioPositionsTableHeader() {
  return (
    <div className={portfolioPositionsTableHeadClass}>
      <span>Market</span>
      <span>Traded</span>
      <span>To Win</span>
      <span>Value</span>
      <span>Time</span>
      <span className="justify-self-end text-right">Action</span>
    </div>
  );
}

export function PortfolioPositionsTable({
  positions,
  snapshots,
  positionTimeMap,
  needsWallet,
  loading,
  onConnectWallet
}: PortfolioPositionsTableProps) {
  const [sellTarget, setSellTarget] = useState<SellTarget | null>(null);
  const [redeemTarget, setRedeemTarget] = useState<RedeemTarget | null>(null);
  const { isRegionBlocked } = useAuth();
  const regionRestricted = isRegionBlocked;

  if (loading) {
    return (
      <p className="px-4 py-8 text-center text-sm text-prophet-muted">Loading positions…</p>
    );
  }

  if (needsWallet) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-10">
        <p className="m-0 text-sm text-prophet-muted">
          Connect your wallet to view positions in your connected account.
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

  if (positions.length === 0) {
    return (
      <div className={portfolioTableScrollClass} aria-label="Your positions">
        <div className={portfolioTableDesktopScrollClass}>
          <PortfolioPositionsTableHeader />
        </div>
        <PortfolioEmptyState
          title="No open positions"
          body="No current Polymarket positions were returned for the connected account."
        />
      </div>
    );
  }

  const desktopRows: ReactNode[] = [];
  const mobileCards: ReactNode[] = [];

  positions.forEach((position) => {
    const snapshot =
      findSnapshotForTokenId(position.asset, snapshots) ??
      findSnapshotForConditionId(position.conditionId, snapshots) ??
      findSnapshotForPosition(position, snapshots);
    const timeValue = positionTimeMap.get(position.asset);
    const pnlTone = position.cashPnl >= 0 ? "text-prophet-green" : "text-prophet-red";
    const marketClosedReason = getPortfolioMarketClosedDisabledReason({
      snapshot,
      endDate: position.endDate
    });
    const marketClosed = Boolean(marketClosedReason);
    const canSell =
      position.size > 0 &&
      Boolean(snapshot) &&
      !marketClosed &&
      (snapshot
        ? isAuthoritativeSnapshotForPosition(position, snapshot) ||
          Boolean(position.slug || position.conditionId)
        : false);
    const canRedeem = canRedeemPosition(position);
    const rowKey = `${position.conditionId}:${position.asset}`;

    const handleSell = () => {
      if (snapshot && !regionRestricted && !marketClosed) {
        useTradeTicketStore.getState().syncForPositionSell(snapshot, position);
        setSellTarget({ position, snapshot });
      }
    };

    const actionButtons = (
      <div className="flex w-full flex-col items-stretch justify-end gap-1 md:items-end">
        {canRedeem ? (
          <RegionRestrictedControl restricted={regionRestricted}>
            <button
              type="button"
              className={cn(
                portfolioActionButtonClass,
                "w-full md:w-auto",
                "disabled:opacity-50"
              )}
              disabled={regionRestricted}
              onClick={() => setRedeemTarget({ position, snapshot })}
            >
              Redeem
            </button>
          </RegionRestrictedControl>
        ) : null}
        {!canRedeem ? (
          <RegionRestrictedControl restricted={regionRestricted}>
            <button
              type="button"
              className={cn(
                portfolioActionButtonClass,
                "w-full md:w-auto",
                "disabled:opacity-50"
              )}
              disabled={!canSell || regionRestricted}
              title={
                regionRestricted
                  ? undefined
                  : marketClosedReason ??
                    (canSell ? undefined : "Market data unavailable")
              }
              onClick={handleSell}
            >
              Sell
            </button>
          </RegionRestrictedControl>
        ) : null}
      </div>
    );

    desktopRows.push(
      <div key={rowKey} className={portfolioPositionsTableRowClass}>
        <PortfolioMarketCell
          title={position.title}
          href={resolveTradeHref(position.eventSlug ?? position.slug)}
          outcome={position.outcome}
          priceLabel={formatSharePrice(position.avgPrice)}
          snapshot={snapshot}
        />
        <span className="font-[556]">
          {formatTeamDetailMoney(position.initialValue)}
        </span>
        <span className="font-[556]">{formatTeamDetailMoney(position.size)}</span>
        <div className="flex flex-col gap-0.5">
          <span className="font-[556]">
            {formatTeamDetailMoney(position.currentValue)}
          </span>
          <span className={cn("text-xs", pnlTone)}>
            {formatPnlSubline(position.cashPnl, position.percentPnl)}
          </span>
        </div>
        <span className="text-prophet-muted">
          {timeValue ? formatPortfolioDateTime(timeValue) : "—"}
        </span>
        {actionButtons}
      </div>
    );

    mobileCards.push(
      <article key={`${rowKey}-mobile`} className={portfolioTableMobileCardClass}>
        <PortfolioMarketCell
          title={position.title}
          href={resolveTradeHref(position.eventSlug ?? position.slug)}
          outcome={position.outcome}
          priceLabel={formatSharePrice(position.avgPrice)}
          snapshot={snapshot}
        />
        <div className="grid grid-cols-2 gap-2">
          <PortfolioTableMobileField label="Traded">
            {formatTeamDetailMoney(position.initialValue)}
          </PortfolioTableMobileField>
          <PortfolioTableMobileField label="To Win">
            {formatTeamDetailMoney(position.size)}
          </PortfolioTableMobileField>
          <PortfolioTableMobileField label="Value">
            <div className="flex flex-col items-end gap-0.5">
              <span>{formatTeamDetailMoney(position.currentValue)}</span>
              <span className={cn("text-xs font-normal", pnlTone)}>
                {formatPnlSubline(position.cashPnl, position.percentPnl)}
              </span>
            </div>
          </PortfolioTableMobileField>
          <PortfolioTableMobileField label="Time" valueClassName="font-normal text-prophet-muted">
            {timeValue ? formatPortfolioDateTime(timeValue) : "—"}
          </PortfolioTableMobileField>
        </div>
        {actionButtons}
      </article>
    );
  });

  return (
    <>
      <div className={portfolioTableScrollClass} aria-label="Your positions">
        <div className={portfolioTableDesktopScrollClass}>
          <PortfolioPositionsTableHeader />
          {desktopRows}
        </div>
        <div className={portfolioTableMobileListClass}>{mobileCards}</div>
      </div>

      {sellTarget ? (
        <PortfolioPositionSellDialog
          open
          position={sellTarget.position}
          snapshot={sellTarget.snapshot}
          onClose={() => setSellTarget(null)}
        />
      ) : null}

      {redeemTarget ? (
        <PortfolioPositionRedeemDialog
          open
          position={redeemTarget.position}
          snapshot={redeemTarget.snapshot}
          onClose={() => setRedeemTarget(null)}
        />
      ) : null}
    </>
  );
}
