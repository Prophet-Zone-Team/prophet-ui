"use client";

import { useState } from "react";

import { RegionRestrictedControl } from "@/components/trading/region-restricted-control";
import { useAuth } from "@/context/auth";
import { cn } from "@/lib/cn";
import {
  formatPortfolioDateTime,
  formatPnlSubline,
  formatSharePrice,
  getOutcomeToneClass
} from "@/lib/portfolio/portfolio-format";
import {
  findSnapshotForConditionId,
  findSnapshotForPosition,
  findSnapshotForTokenId,
  isAuthoritativeSnapshotForPosition
} from "@/lib/portfolio/portfolio-metrics";
import { resolveTradeHref } from "@/lib/routes/trade";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import { useTradeTicketStore } from "@/store/trade-ticket-store";
import type { TeamMarketSnapshot, UserPositionRecord } from "@/types/market";
import { TeamFlag } from "@/components/teams/team-flag";
import { PortfolioEmptyState } from "@/views/portfolio/portfolio-empty-state";
import { PortfolioPositionSellDialog } from "@/views/portfolio/portfolio-position-sell-dialog";
import {
  portfolioActionButtonClass,
  portfolioConnectButtonClass,
  portfolioPositionsTableHeadClass,
  portfolioPositionsTableRowClass,
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

function PortfolioPositionsTableHeader() {
  return (
    <div className={portfolioPositionsTableHeadClass}>
      <span>Market</span>
      <span>Traded</span>
      <span>To Win</span>
      <span>Value</span>
      <span>Time</span>
      <span
        aria-hidden="true"
        className={cn(
          portfolioActionButtonClass,
          "invisible pointer-events-none justify-self-end"
        )}
      >
        Sell
      </span>
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
        <PortfolioPositionsTableHeader />
        <PortfolioEmptyState
          title="No open positions"
          body="No current Polymarket positions were returned for the connected account."
        />
      </div>
    );
  }

  const rows = positions.map((position) => {
    const snapshot =
      findSnapshotForTokenId(position.asset, snapshots) ??
      findSnapshotForConditionId(position.conditionId, snapshots) ??
      findSnapshotForPosition(position, snapshots);
    const timeValue = positionTimeMap.get(position.asset);
    const pnlTone = position.cashPnl >= 0 ? "text-prophet-green" : "text-prophet-red";
    const canSell =
      position.size > 0 &&
      Boolean(snapshot) &&
      (snapshot
        ? isAuthoritativeSnapshotForPosition(position, snapshot) ||
          Boolean(position.slug || position.conditionId)
        : false);

    return (
      <div
        key={`${position.conditionId}:${position.asset}`}
        className={portfolioPositionsTableRowClass}
      >
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
            <a
              href={resolveTradeHref(position.eventSlug ?? position.slug)}
              className="m-0 truncate font-[556] text-black hover:underline"
            >
              {position.title}
            </a>
            <p
              className={cn(
                "m-0 mt-0.5 text-xs",
                getOutcomeToneClass(position.outcome)
              )}
            >
              {position.outcome} {formatSharePrice(position.avgPrice)}
            </p>
          </div>
        </div>
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
        <RegionRestrictedControl restricted={regionRestricted}>
          <button
            type="button"
            className={cn(
              portfolioActionButtonClass,
              "justify-self-end",
              "disabled:opacity-50"
            )}
            disabled={!canSell || regionRestricted}
            title={canSell || regionRestricted ? undefined : "Market data unavailable"}
            onClick={() => {
              if (snapshot && !regionRestricted) {
                useTradeTicketStore
                  .getState()
                  .syncForPositionSell(snapshot, position);
                setSellTarget({ position, snapshot });
              }
            }}
          >
            Sell
          </button>
        </RegionRestrictedControl>
      </div>
    );
  });

  return (
    <>
      <div className={portfolioTableScrollClass} aria-label="Your positions">
        <PortfolioPositionsTableHeader />
        {rows}
      </div>

      {sellTarget ? (
        <PortfolioPositionSellDialog
          open
          position={sellTarget.position}
          snapshot={sellTarget.snapshot}
          onClose={() => setSellTarget(null)}
        />
      ) : null}
    </>
  );
}
