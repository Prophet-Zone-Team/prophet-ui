"use client";

import { useCallback, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { RegionRestrictedControl } from "@/components/trading/region-restricted-control";
import { useAuth } from "@/context/auth";
import { cn } from "@/lib/cn";
import { submitCopyTradeSellSigned } from "@/lib/copy-trade/auth";
import { canCopyTradePositionSell } from "@/lib/copy-trade/evaluate-copy-position-sell";
import {
  mapCopyPositionPnLToClosedUserPositionRecord,
  mapCopyPositionPnLToUserPositionRecord
} from "@/lib/copy-trade/map-copy-position-pnl";
import {
  formatPortfolioDateTime,
  formatPnlSubline,
  formatSharePrice
} from "@/lib/portfolio/portfolio-format";
import {
  resolvePortfolioPositionIcon,
  type OpenOrderMarketContext
} from "@/lib/portfolio/teams-condition";
import { resolvePortfolioPositionTradeHref } from "@/lib/portfolio/resolve-position-trade-href";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import { CopyTradeApiError } from "@/service/copy-trade";
import { getCopyTradeSellableBalance } from "@/service/copy-trade";
import type {
  CopyPositionPnL,
  CopyTradeSellableBalance
} from "@/types/copy-trade-api";
import { PortfolioEmptyState } from "@/views/portfolio/portfolio-empty-state";
import { PortfolioMarketCell } from "@/views/portfolio/portfolio-market-cell";
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

import {
  CopyTradePositionSellDialog,
  type CopyTradePositionSellConfirm
} from "./copy-trade-position-sell-dialog";

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

export interface CopyTradePortfolioPositionsTableProps {
  positions: CopyPositionPnL[];
  marketContextMap: Record<string, OpenOrderMarketContext>;
  positionTimeMap: Map<string, string>;
  userId?: number;
  walletAddress?: string;
  needsWallet: boolean;
  loading: boolean;
  readOnly?: boolean;
  proxyWallet?: string;
  onConnectWallet: () => void;
  onSellSuccess?: () => void | Promise<void>;
}

function PortfolioPositionsTableHeader({
  readOnly = false
}: {
  readOnly?: boolean;
}) {
  const t = useTranslations("portfolio");

  return (
    <div
      className={
        readOnly
          ? portfolioPositionsReadOnlyHeadClass
          : portfolioPositionsTableHeadClass
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

function resolveCopyTradeApiError(error: unknown, fallback: string): string {
  if (error instanceof CopyTradeApiError) {
    return error.message || fallback;
  }

  return error instanceof Error ? error.message : fallback;
}

export function CopyTradePortfolioPositionsTable({
  positions,
  marketContextMap,
  positionTimeMap,
  userId,
  walletAddress,
  needsWallet,
  loading,
  readOnly = false,
  proxyWallet = "",
  onConnectWallet,
  onSellSuccess
}: CopyTradePortfolioPositionsTableProps) {
  const t = useTranslations("portfolio");
  const tSell = useTranslations("copyTrade.portfolio.sell");
  const { isRegionBlocked } = useAuth();
  const regionRestricted = isRegionBlocked;

  const [sellTarget, setSellTarget] = useState<CopyPositionPnL | null>(null);
  const [sellable, setSellable] = useState<CopyTradeSellableBalance | null>(
    null
  );
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [selling, setSelling] = useState(false);
  const [actionLoadingAsset, setActionLoadingAsset] = useState<string | null>(
    null
  );

  const closeSellDialog = useCallback(() => {
    if (selling) {
      return;
    }

    setSellTarget(null);
    setSellable(null);
    setLoadingBalance(false);
  }, [selling]);

  const openSellDialog = useCallback(
    async (row: CopyPositionPnL) => {
      if (!canCopyTradePositionSell(row) || regionRestricted) {
        return;
      }

      if (!userId) {
        toast.error(tSell("failed"));
        return;
      }

      if (!row.token_id?.trim()) {
        toast.error(tSell("missingToken"));
        return;
      }

      setSellTarget(row);
      setSellable(null);
      setLoadingBalance(true);
      setActionLoadingAsset(row.token_id);

      try {
        const balance = await getCopyTradeSellableBalance(userId, row.token_id);
        setSellable(balance);
      } catch (error) {
        toast.error(resolveCopyTradeApiError(error, tSell("balanceFailed")));
        setSellTarget(null);
      } finally {
        setLoadingBalance(false);
        setActionLoadingAsset(null);
      }
    },
    [regionRestricted, tSell, userId]
  );

  const handleSellConfirm = useCallback(
    async (request: CopyTradePositionSellConfirm) => {
      if (!sellTarget || !userId || !walletAddress) {
        return;
      }

      if (!sellTarget.token_id?.trim()) {
        toast.error(tSell("missingToken"));
        return;
      }

      if (!sellTarget.condition_id?.trim()) {
        toast.error(tSell("missingCondition"));
        return;
      }

      setSelling(true);

      try {
        const body = {
          token_id: sellTarget.token_id,
          condition_id: sellTarget.condition_id,
          ...(request.sellAll
            ? { sell_all: true as const }
            : { shares: request.shares })
        };

        const result = await submitCopyTradeSellSigned(
          walletAddress,
          userId,
          body
        );

        toast.success(
          tSell("success", {
            shares: result.shares.toLocaleString(undefined, {
              maximumFractionDigits: 6
            })
          })
        );
        closeSellDialog();
        await onSellSuccess?.();
      } catch (error) {
        toast.error(resolveCopyTradeApiError(error, tSell("failed")));
      } finally {
        setSelling(false);
      }
    },
    [closeSellDialog, onSellSuccess, sellTarget, tSell, userId, walletAddress]
  );

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
      <div
        className={portfolioTableScrollClass}
        aria-label={t("yourPositions")}
      >
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

  positions.forEach((row) => {
    const position = readOnly
      ? mapCopyPositionPnLToClosedUserPositionRecord(row, { proxyWallet })
      : mapCopyPositionPnLToUserPositionRecord(row, { proxyWallet });
    const marketContext = marketContextMap[position.conditionId];
    const teams = marketContext?.teams ?? [];
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
    const canSell = canCopyTradePositionSell(row);
    const rowKey = `${position.conditionId}:${position.asset}`;
    const isActionLoading = actionLoadingAsset === position.asset;

    const actionButtons = readOnly ? null : (
      <div className="flex w-full flex-col items-stretch justify-end gap-1 md:items-end">
        {canSell ? (
          <RegionRestrictedControl restricted={regionRestricted}>
            <button
              type="button"
              className={cn(
                portfolioActionButtonClass,
                "w-full md:w-auto",
                "disabled:opacity-50"
              )}
              disabled={regionRestricted || isActionLoading}
              onClick={() => void openSellDialog(row)}
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
        ) : null}
      </div>
    );

    desktopRows.push(
      <div
        key={rowKey}
        className={
          readOnly
            ? portfolioPositionsReadOnlyRowClass
            : portfolioPositionsTableRowClass
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

  const sellPositionRecord = sellTarget
    ? mapCopyPositionPnLToUserPositionRecord(sellTarget, { proxyWallet })
    : null;

  return (
    <>
      <div
        className={portfolioTableScrollClass}
        aria-label={t("yourPositions")}
      >
        <div className={portfolioTableDesktopScrollClass}>
          <PortfolioPositionsTableHeader readOnly={readOnly} />
          {desktopRows}
        </div>
        <div className={portfolioTableMobileListClass}>{mobileCards}</div>
      </div>

      {sellTarget && sellPositionRecord ? (
        <CopyTradePositionSellDialog
          open
          position={sellPositionRecord}
          sellable={sellable}
          loadingBalance={loadingBalance}
          selling={selling}
          onClose={closeSellDialog}
          onConfirm={(request) => void handleSellConfirm(request)}
        />
      ) : null}
    </>
  );
}
