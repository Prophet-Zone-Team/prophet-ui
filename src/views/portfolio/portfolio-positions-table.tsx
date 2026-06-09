"use client";

import { useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { RegionRestrictedControl } from "@/components/trading/region-restricted-control";
import { useAuth } from "@/context/auth";
import { cn } from "@/lib/cn";
import {
  evaluateGamePositionSellReadiness,
  evaluatePositionRedeemReadiness,
  evaluateTeamPositionSellReadiness,
} from "@/lib/portfolio/evaluate-position-sell-readiness";
import { fetchPositionSellSnapshot } from "@/lib/portfolio/fetch-position-sell-snapshot";
import { fetchPositionGameSellContext } from "@/lib/portfolio/fetch-position-game-sell-context";
import type { PositionGameSellContext } from "@/lib/portfolio/resolve-position-game-sell-context";
import {
  formatPortfolioDateTime,
  formatPnlSubline,
  formatSharePrice
} from "@/lib/portfolio/portfolio-format";
import { canRedeemPosition } from "@/lib/portfolio/portfolio-metrics";
import {
  resolvePortfolioMarketIcon,
  resolvePortfolioTeamName,
  type OpenOrderMarketContext
} from "@/lib/portfolio/teams-condition";
import { resolvePortfolioPositionTradeHref } from "@/lib/portfolio/resolve-position-trade-href";
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
  marketContextMap: Record<string, OpenOrderMarketContext>;
  positionTimeMap: Map<string, string>;
  needsWallet: boolean;
  loading: boolean;
  onConnectWallet: () => void;
}

type SellTarget =
  | {
      variant: "team";
      position: UserPositionRecord;
      snapshot: TeamMarketSnapshot;
    }
  | {
      variant: "game";
      position: UserPositionRecord;
      context: PositionGameSellContext;
    };

type RedeemTarget = {
  position: UserPositionRecord;
  teamName?: string;
};

function PortfolioPositionsTableHeader() {
  return (
    <div className={portfolioPositionsTableHeadClass}>
      <span>Market</span>
      <span>Traded</span>
      <span>To Win</span>
      <span>Value</span>
      <span className="justify-self-end text-right">Action</span>
    </div>
  );
}

export function PortfolioPositionsTable({
  positions,
  marketContextMap,
  positionTimeMap,
  needsWallet,
  loading,
  onConnectWallet
}: PortfolioPositionsTableProps) {
  const [sellTarget, setSellTarget] = useState<SellTarget | null>(null);
  const [redeemTarget, setRedeemTarget] = useState<RedeemTarget | null>(null);
  const [actionLoadingAsset, setActionLoadingAsset] = useState<string | null>(
    null
  );
  const {
    isRegionBlocked,
    isBuyRestricted,
    isRegionCloseOnly,
    isAuthenticated,
    session,
    readiness,
    refreshSetupReadiness,
  } = useAuth();
  const regionRestricted = isRegionBlocked;
  const sellReadinessInput = {
    isAuthenticated,
    session,
    authReadiness: readiness,
    isRegionBlocked,
    isBuyRestricted,
    isRegionCloseOnly,
  };

  if (loading) {
    return (
      <p className="px-4 py-8 text-center text-sm text-prophet-muted">
        Loading positions…
      </p>
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
    const marketContext = marketContextMap[position.conditionId];
    const teams = marketContext?.teams ?? [];
    const teamName = resolvePortfolioTeamName(teams, position);
    const marketIcon = resolvePortfolioMarketIcon(teams, position.outcome);
    const tradeHref = resolvePortfolioPositionTradeHref(
      { slug: position.slug?.trim() || marketContext?.slug || "" },
      teams
    );
    const timeValue = positionTimeMap.get(position.asset);
    const pnlTone =
      position.cashPnl >= 0 ? "text-prophet-green" : "text-prophet-red";
    const canSell = position.size > 0 && Boolean(position.slug?.trim());
    const canRedeem = canRedeemPosition(position);
    const rowKey = `${position.conditionId}:${position.asset}`;
    const isActionLoading = actionLoadingAsset === position.asset;

    const handleSell = async () => {
      if (!canSell || regionRestricted || isActionLoading) {
        return;
      }

      setActionLoadingAsset(position.asset);

      try {
        const teamSnapshot = await fetchPositionSellSnapshot(position);

        if (teamSnapshot) {
          const readinessResult = await evaluateTeamPositionSellReadiness(
            teamSnapshot,
            { position, ...sellReadinessInput }
          );

          if (!readinessResult.ok) {
            toast.error(
              readinessResult.message ??
                "This position is not available to sell right now."
            );
            return;
          }

          useTradeTicketStore.getState().syncForPositionSell(
            teamSnapshot,
            position
          );
          setSellTarget({ variant: "team", position, snapshot: teamSnapshot });
          return;
        }

        const gameContext = await fetchPositionGameSellContext(position);

        if (!gameContext) {
          toast.error("Market data unavailable");
          return;
        }

        const readinessResult = await evaluateGamePositionSellReadiness(
          gameContext,
          { position, ...sellReadinessInput }
        );

        if (!readinessResult.ok) {
          toast.error(
            readinessResult.message ??
              "This position is not available to sell right now."
          );
          return;
        }

        useTradeTicketStore.getState().syncForGamePositionSell(
          gameContext,
          position
        );
        setSellTarget({ variant: "game", position, context: gameContext });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Market data unavailable";
        toast.error(message);
      } finally {
        setActionLoadingAsset(null);
      }
    };

    const handleRedeem = async () => {
      if (regionRestricted || isActionLoading) {
        return;
      }

      setActionLoadingAsset(position.asset);

      try {
        const latestReadiness =
          (await refreshSetupReadiness()) ?? readiness;
        const readinessResult = evaluatePositionRedeemReadiness({
          session,
          readiness: latestReadiness,
        });

        if (!readinessResult.ok) {
          toast.error(
            readinessResult.message ??
              "This position is not available to redeem right now."
          );
          return;
        }

        setRedeemTarget({ position, teamName });
      } finally {
        setActionLoadingAsset(null);
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
              disabled={regionRestricted || isActionLoading}
              onClick={() => void handleRedeem()}
            >
              {isActionLoading ? (
                <Loader2
                  className="h-3.5 w-3.5 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                "Redeem"
              )}
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
              disabled={!canSell || regionRestricted || isActionLoading}
              onClick={() => void handleSell()}
            >
              {isActionLoading ? (
                <Loader2
                  className="h-3.5 w-3.5 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                "Sell"
              )}
            </button>
          </RegionRestrictedControl>
        ) : null}
      </div>
    );

    desktopRows.push(
      <div key={rowKey} className={portfolioPositionsTableRowClass}>
        <PortfolioMarketCell
          title={position.title}
          href={tradeHref}
          outcome={position.outcome}
          priceLabel={formatSharePrice(position.avgPrice)}
          shares={position.size}
          icon={marketIcon}
        />
        <span className="font-[500]">
          {formatTeamDetailMoney(position.initialValue)}
        </span>
        <span className="font-[500]">
          {formatTeamDetailMoney(position.size)}
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="font-[500]">
            {formatTeamDetailMoney(position.currentValue)}
          </span>
          <span className={cn("text-xs", pnlTone)}>
            {formatPnlSubline(position.cashPnl, position.percentPnl)}
          </span>
        </div>
        {actionButtons}
      </div>
    );

    mobileCards.push(
      <article
        key={`${rowKey}-mobile`}
        className={portfolioTableMobileCardClass}
      >
        <PortfolioMarketCell
          title={position.title}
          href={tradeHref}
          outcome={position.outcome}
          priceLabel={formatSharePrice(position.avgPrice)}
          shares={position.size}
          icon={marketIcon}
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
          <PortfolioTableMobileField
            label="Time"
            valueClassName="font-normal text-prophet-muted"
          >
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

      {sellTarget?.variant === "team" ? (
        <PortfolioPositionSellDialog
          open
          variant="team"
          position={sellTarget.position}
          snapshot={sellTarget.snapshot}
          onClose={() => setSellTarget(null)}
        />
      ) : null}

      {sellTarget?.variant === "game" ? (
        <PortfolioPositionSellDialog
          open
          variant="game"
          position={sellTarget.position}
          context={sellTarget.context}
          onClose={() => setSellTarget(null)}
        />
      ) : null}

      {redeemTarget ? (
        <PortfolioPositionRedeemDialog
          open
          position={redeemTarget.position}
          teamName={redeemTarget.teamName}
          onClose={() => setRedeemTarget(null)}
        />
      ) : null}
    </>
  );
}
