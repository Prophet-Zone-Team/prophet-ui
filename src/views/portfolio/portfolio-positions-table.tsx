"use client";

import { useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
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
  resolvePortfolioPositionIcon,
  resolvePortfolioTeamName,
  type OpenOrderMarketContext,
  type PortfolioMarketIcon,
} from "@/lib/portfolio/teams-condition";
import { resolvePortfolioPositionTradeHref } from "@/lib/portfolio/resolve-position-trade-href";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import { useTradeTicketStore } from "@/store/trade-ticket-store";
import type { TeamMarketSnapshot, UserPositionRecord } from "@/types/market";
import { PortfolioEmptyState } from "@/views/portfolio/portfolio-empty-state";
import { PortfolioMarketCell } from "@/views/portfolio/portfolio-market-cell";
import { PortfolioPositionRedeemDialog } from "@/views/portfolio/portfolio-position-redeem-dialog";
import { PortfolioPositionSellDialog } from "@/views/portfolio/portfolio-position-sell-dialog";
import {
  PortfolioPositionShareModal,
} from "@/views/portfolio/portfolio-position-share-modal";
import type { PortfolioPositionShareVariant } from "@/views/portfolio/portfolio-position-share-card";
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
  readOnly?: boolean;
  onConnectWallet: () => void;
}

const portfolioPositionsReadOnlyGridClass =
  "grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]";

const portfolioPositionsReadOnlyHeadClass = cn(
  "hidden min-w-[720px] gap-3 px-4 py-2 text-xs text-prophet-muted md:grid",
  portfolioPositionsReadOnlyGridClass
);

const portfolioPositionsReadOnlyRowClass = cn(
  "hidden min-w-[720px] gap-3 border-b border-prophet-line px-4 py-3 text-sm last:border-b-0 items-center md:grid",
  portfolioPositionsReadOnlyGridClass
);

type SellTarget =
  | {
    variant: "team";
    position: UserPositionRecord;
    snapshot: TeamMarketSnapshot;
    tradeHref?: string;
    marketIcon: PortfolioMarketIcon;
  }
  | {
    variant: "game";
    position: UserPositionRecord;
    context: PositionGameSellContext;
    tradeHref?: string;
    marketIcon: PortfolioMarketIcon;
  };

type RedeemTarget = {
  position: UserPositionRecord;
  teamName?: string;
};

type ShareTarget = {
  position: UserPositionRecord;
  marketIcon: PortfolioMarketIcon;
  variant: PortfolioPositionShareVariant;
  cashedOutAmount?: number;
};

function PortfolioPositionsTableHeader({
  readOnly = false
}: {
  readOnly?: boolean;
}) {
  const t = useTranslations("portfolio");

  return (
    <div
      className={
        readOnly ? portfolioPositionsReadOnlyHeadClass : portfolioPositionsTableHeadClass
      }
    >
      <span>{t("market")}</span>
      <span>{t("traded")}</span>
      <span>{t("toWin")}</span>
      <span>{t("value")}</span>
      {readOnly ? null : (
        <span className="justify-self-end text-right">{t("action")}</span>
      )}
    </div>
  );
}

export function PortfolioPositionsTable({
  positions,
  marketContextMap,
  positionTimeMap,
  needsWallet,
  loading,
  readOnly = false,
  onConnectWallet
}: PortfolioPositionsTableProps) {
  const t = useTranslations("portfolio");
  const [sellTarget, setSellTarget] = useState<SellTarget | null>(null);
  const [redeemTarget, setRedeemTarget] = useState<RedeemTarget | null>(null);
  const [shareTarget, setShareTarget] = useState<ShareTarget | null>(null);
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
  const polymarketAddress = session?.funderAddress ?? session?.walletAddress;
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
        {t("loadingPositions")}
      </p>
    );
  }

  if (needsWallet) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-10">
        <p className="m-0 text-sm text-prophet-muted">
          {t("connectWalletToViewPositions")}
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

  if (positions.length === 0) {
    return (
      <div className={portfolioTableScrollClass} aria-label={t("yourPositions")}>
        <div className={portfolioTableDesktopScrollClass}>
          <PortfolioPositionsTableHeader readOnly={readOnly} />
        </div>
        <PortfolioEmptyState
          title={t("noOpenPositions")}
          body={t("noOpenPositionsBody")}
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
    const marketIcon = resolvePortfolioPositionIcon(position, teams, {
      contextIcon: marketContext?.icon,
      marketKind: marketContext?.marketKind
    });
    const tradeHref = resolvePortfolioPositionTradeHref(
      {
        slug: position.slug,
        eventSlug: position.eventSlug
      },
      {
        marketKind: marketContext?.marketKind,
        contextSlug: marketContext?.slug,
        teams
      }
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
              readinessResult.message ?? t("positionNotAvailableToSell")
            );
            return;
          }

          useTradeTicketStore.getState().syncForPositionSell(
            teamSnapshot,
            position
          );
          setSellTarget({
            variant: "team",
            position,
            snapshot: teamSnapshot,
            tradeHref,
            marketIcon,
          });
          return;
        }

        const gameContext = await fetchPositionGameSellContext(position);

        if (!gameContext) {
          toast.error(t("marketDataUnavailable"));
          return;
        }

        const readinessResult = await evaluateGamePositionSellReadiness(
          gameContext,
          { position, ...sellReadinessInput }
        );

        if (!readinessResult.ok) {
          toast.error(
            readinessResult.message ?? t("positionNotAvailableToSell")
          );
          return;
        }

        useTradeTicketStore.getState().syncForGamePositionSell(
          gameContext,
          position
        );
        setSellTarget({
          variant: "game",
          position,
          context: gameContext,
          tradeHref,
          marketIcon,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : t("marketDataUnavailable");
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
            readinessResult.message ?? t("positionNotAvailableToRedeem")
          );
          return;
        }

        setRedeemTarget({ position, teamName });
      } finally {
        setActionLoadingAsset(null);
      }
    };

    const actionButtons = readOnly ? null : (
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
                t("redeem")
              )}
            </button>
          </RegionRestrictedControl>
        ) : null}
        {!canRedeem ? (
          <div className="flex items-center gap-2 justify-end">
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
                  t("sell")
                )}
              </button>
            </RegionRestrictedControl>
            <button
              type="button"
              className="shrink-0 px-[8px] h-[32px] cursor-pointer hover:bg-prophet-action-panel disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={t("shareMyPosition")}
              disabled={needsWallet || !polymarketAddress}
              onClick={() =>
                setShareTarget({
                  position,
                  marketIcon,
                  variant: "open",
                })
              }
            >
              <img
                src="/icons/icon-share.svg"
                alt=""
                className="w-3 h-3 shrink-0"
                aria-hidden="true"
              />
            </button>
          </div>
        ) : null}
      </div>
    );

    desktopRows.push(
      <div
        key={rowKey}
        className={
          readOnly ? portfolioPositionsReadOnlyRowClass : portfolioPositionsTableRowClass
        }
      >
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
          <PortfolioTableMobileField label={t("traded")}>
            {formatTeamDetailMoney(position.initialValue)}
          </PortfolioTableMobileField>
          <PortfolioTableMobileField label={t("toWin")}>
            {formatTeamDetailMoney(position.size)}
          </PortfolioTableMobileField>
          <PortfolioTableMobileField label={t("value")}>
            <div className="flex flex-col items-end gap-0.5">
              <span>{formatTeamDetailMoney(position.currentValue)}</span>
              <span className={cn("text-xs font-normal", pnlTone)}>
                {formatPnlSubline(position.cashPnl, position.percentPnl)}
              </span>
            </div>
          </PortfolioTableMobileField>
          <PortfolioTableMobileField
            label={t("time")}
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
      <div className={portfolioTableScrollClass} aria-label={t("yourPositions")}>
        <div className={portfolioTableDesktopScrollClass}>
          <PortfolioPositionsTableHeader readOnly={readOnly} />
          {desktopRows}
        </div>
        <div className={portfolioTableMobileListClass}>{mobileCards}</div>
      </div>

      {!readOnly && sellTarget?.variant === "team" ? (
        <PortfolioPositionSellDialog
          open
          variant="team"
          position={sellTarget.position}
          snapshot={sellTarget.snapshot}
          tradeHref={sellTarget.tradeHref}
          onClose={() => setSellTarget(null)}
          onCashOutSuccess={({ position, cashedOutAmount }) => {
            setSellTarget(null);
            setShareTarget({
              position,
              marketIcon: sellTarget.marketIcon,
              variant: "cashedOut",
              cashedOutAmount,
            });
          }}
        />
      ) : null}

      {!readOnly && sellTarget?.variant === "game" ? (
        <PortfolioPositionSellDialog
          open
          variant="game"
          position={sellTarget.position}
          context={sellTarget.context}
          tradeHref={sellTarget.tradeHref}
          onClose={() => setSellTarget(null)}
          onCashOutSuccess={({ position, cashedOutAmount }) => {
            setSellTarget(null);
            setShareTarget({
              position,
              marketIcon: sellTarget.marketIcon,
              variant: "cashedOut",
              cashedOutAmount,
            });
          }}
        />
      ) : null}

      {!readOnly && redeemTarget ? (
        <PortfolioPositionRedeemDialog
          open
          position={redeemTarget.position}
          teamName={redeemTarget.teamName}
          onClose={() => setRedeemTarget(null)}
        />
      ) : null}

      {shareTarget ? (
        <PortfolioPositionShareModal
          open
          onClose={() => setShareTarget(null)}
          position={shareTarget.position}
          marketIcon={shareTarget.marketIcon}
          variant={shareTarget.variant}
          cashedOutAmount={shareTarget.cashedOutAmount}
          funderAddress={polymarketAddress}
        />
      ) : null}
    </>
  );
}
