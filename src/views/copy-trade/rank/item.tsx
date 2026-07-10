"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import {
  isUserImportedTrader,
  traderTag
} from "@/lib/copy-trade/trader-catalog-stats";
import {
  resolveTraderRankDisplayStats,
  type CopyTradeRankTimeRange
} from "@/lib/copy-trade/trader-rank-filters";
import { formatCompactVolume } from "@/lib/formatters/volume";
import type { TraderCatalogEntry } from "@/types/copy-trade-api";
import { CopyTradeButton } from "@/views/copy-trade/copy-trade-button";
import { copyTradeTableMobileCardClass } from "@/views/copy-trade/copy-trade-ui";
import { CopyButton } from "@/components/feedback/copy-button";
import { CopyIcon } from "@/components/icons";
import { formatShortWallet } from "@/lib/team/detail-format";
import {
  TraderAvatar,
  TraderBadge,
  TraderIdentity,
  TraderTagIcon,
  TraderTrackButton
} from "@/views/copy-trade/trader-identity";
import { PortfolioTableMobileField } from "@/views/portfolio/portfolio-table-mobile";

import {
  copyTradeRankColActionClass,
  copyTradeRankColPnl7dClass,
  copyTradeRankColStatClass,
  copyTradeRankColPlayerClass,
  copyTradeRankColPredictionsClass,
  copyTradeRankColRankClass,
  copyTradeRankGridStyle,
  copyTradeRankRowGridClass
} from "./grid";

export interface CopyTradeRankItemProps {
  rank: number;
  trader: TraderCatalogEntry;
  timeRange?: CopyTradeRankTimeRange;
  tracked?: boolean;
  onTrackToggle?: (trader: TraderCatalogEntry) => void;
  onCopyTrade?: (trader: TraderCatalogEntry) => void;
  copyTradeBusy?: boolean;
  copyTradeDisabled?: boolean;
  copyTradeDisabledReason?: string | null;
  layout?: "desktop" | "mobile";
  className?: string;
}

function formatWinRate(value: number): string {
  const percent = value > 0 && value <= 1 ? value * 100 : value;
  return `${percent.toFixed(1)}%`;
}

function formatSignedCompactUsd(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  const formatted = formatCompactVolume(Math.abs(value)) ?? "$0";
  return `${sign}${formatted}`;
}

function formatStatValue(
  value: number | null,
  formatter: (next: number) => string
): string {
  if (value === null) {
    return "—";
  }

  return formatter(value);
}

function resolveTraderPnl7d(trader: TraderCatalogEntry): number | null {
  const value = trader.PnL7D;
  if (value == null || !Number.isFinite(value)) {
    return null;
  }

  return value;
}

function resolveTraderFifaPnl7d(trader: TraderCatalogEntry): number | null {
  const value = trader.FifaPnL7d;
  if (value == null || !Number.isFinite(value)) {
    return null;
  }

  return value;
}

function pnlToneClass(value: number | null): string {
  if (value === null) {
    return "text-prophet-muted";
  }

  return value >= 0 ? "text-[#65AF14]" : "text-[#FF674B]";
}

function Pnl7dDualValue({ pnl7d, fifaPnl7d }: { pnl7d: number | null; fifaPnl7d: number | null }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-0.5">
      <span className={pnlToneClass(pnl7d)}>
        {formatStatValue(pnl7d, formatSignedCompactUsd)}
      </span>
      <span className="shrink-0 text-prophet-muted">/</span>
      <span className={pnlToneClass(fifaPnl7d)}>
        {formatStatValue(fifaPnl7d, formatSignedCompactUsd)}
      </span>
    </span>
  );
}

export function CopyTradeRankItem({
  rank,
  trader,
  timeRange = "all",
  tracked = false,
  onTrackToggle,
  onCopyTrade,
  copyTradeBusy = false,
  copyTradeDisabled = false,
  copyTradeDisabledReason = null,
  layout = "desktop",
  className
}: CopyTradeRankItemProps) {
  const t = useTranslations("copyTrade.rank");
  const tCommon = useTranslations("copyTrade.common");
  const displayName = trader.DisplayName || formatShortWallet(trader.Wallet);
  const walletLabel = formatShortWallet(trader.Wallet);
  const imported = isUserImportedTrader(trader);
  const tag = traderTag(trader);
  const isCopyButtonDisabled = copyTradeBusy || copyTradeDisabled;
  const stats = resolveTraderRankDisplayStats(trader, timeRange);
  const pnl7d = resolveTraderPnl7d(trader);
  const fifaPnl7d = resolveTraderFifaPnl7d(trader);
  const pnlValue = stats.pnl ?? 0;
  const pnlTone =
    stats.pnl === null
      ? "text-prophet-muted"
      : pnlValue >= 0
        ? "text-[#65AF14]"
        : "text-[#FF674B]";
  if (layout === "mobile") {
    return (
      <article
        className={cn(
          copyTradeTableMobileCardClass,
          "transition-colors hover:bg-prophet-hover",
          className
        )}
      >
        <div className="flex items-start gap-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-prophet-action-panel text-[16px] leading-5 text-prophet-foreground tabular-nums">
            {rank}
          </span>
          <TraderIdentity trader={trader} className="min-w-0 flex-1" />
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <PortfolioTableMobileField label={t("winRate")}>
            {formatStatValue(stats.winRate, formatWinRate)}
          </PortfolioTableMobileField>
          <PortfolioTableMobileField
            label={t("profitLoss")}
            valueClassName={pnlTone}
          >
            {formatStatValue(stats.pnl, formatSignedCompactUsd)}
          </PortfolioTableMobileField>
          <PortfolioTableMobileField label={t("volume")}>
            {formatStatValue(
              stats.volume,
              (value) => formatCompactVolume(value) ?? "$0"
            )}
          </PortfolioTableMobileField>
          <PortfolioTableMobileField label={t("predictions")}>
            {formatStatValue(stats.trades, (value) => String(value))}
          </PortfolioTableMobileField>
          <div className="col-span-2">
            <PortfolioTableMobileField
              label={t("pnl7d")}
              inline
              labelClassName="shrink-0 whitespace-nowrap"
              valueClassName="text-[12px] leading-[14px] tabular-nums"
            >
              <Pnl7dDualValue pnl7d={pnl7d} fifaPnl7d={fifaPnl7d} />
            </PortfolioTableMobileField>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-prophet-line pt-3">
          <TraderTrackButton
            tracked={tracked}
            onToggle={() => onTrackToggle?.(trader)}
          />
          <CopyTradeButton
            busy={copyTradeBusy}
            disabled={isCopyButtonDisabled}
            disabledReason={copyTradeDisabledReason}
            onClick={() => onCopyTrade?.(trader)}
          />
        </div>
      </article>
    );
  }

  return (
    <article
      style={copyTradeRankGridStyle}
      className={cn(
        "box-border col-span-full h-[74px] rounded-xl border border-prophet-line bg-prophet-panel px-4 transition-colors hover:bg-prophet-hover",
        copyTradeRankRowGridClass,
        className
      )}
    >
      <span
        className={cn(
          copyTradeRankColRankClass,
          "text-[16px] leading-5 text-prophet-foreground tabular-nums"
        )}
      >
        {rank}
      </span>

      <div
        className={cn(copyTradeRankColPlayerClass, "flex items-center gap-3")}
      >
        <TraderAvatar wallet={trader.Wallet} />
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="max-w-[160px] truncate text-[16px] leading-5 text-prophet-foreground">
              {displayName}
            </p>
            {imported ? (
              <TraderBadge className="bg-prophet-hover text-prophet-muted">
                {tCommon("imported")}
              </TraderBadge>
            ) : null}
            {tag ? <TraderTagIcon tag={tag} /> : null}
          </div>
          <div className="mt-px flex min-w-0 items-center gap-1">
            <span className="truncate text-[12px] leading-[15px] text-prophet-muted">
              {walletLabel}
            </span>
            <CopyButton
              text={trader.Wallet}
              ariaLabel={tCommon("copyWalletAddress")}
              className="inline-flex shrink-0 items-center justify-center p-0.5 text-prophet-muted transition-opacity hover:opacity-70"
            >
              <CopyIcon />
            </CopyButton>
          </div>
        </div>
      </div>

      <span
        className={cn(
          copyTradeRankColStatClass,
          "text-[16px] leading-5 text-prophet-muted tabular-nums"
        )}
      >
        {formatStatValue(stats.winRate, formatWinRate)}
      </span>
      <span
        className={cn(
          copyTradeRankColStatClass,
          "text-[16px] leading-5 tabular-nums",
          pnlTone
        )}
      >
        {formatStatValue(stats.pnl, formatSignedCompactUsd)}
      </span>
      <span
        className={cn(
          copyTradeRankColStatClass,
          "text-[16px] leading-5 text-prophet-muted tabular-nums"
        )}
      >
        {formatStatValue(
          stats.volume,
          (value) => formatCompactVolume(value) ?? "$0"
        )}
      </span>
      <span
        className={cn(
          copyTradeRankColPredictionsClass,
          "text-[16px] leading-5 text-prophet-muted"
        )}
      >
        {formatStatValue(stats.trades, (value) => String(value))}
      </span>
      <span className={copyTradeRankColPnl7dClass}>
        <Pnl7dDualValue pnl7d={pnl7d} fifaPnl7d={fifaPnl7d} />
      </span>

      <div className={copyTradeRankColActionClass}>
        <TraderTrackButton
          tracked={tracked}
          onToggle={() => onTrackToggle?.(trader)}
        />
        <CopyTradeButton
          busy={copyTradeBusy}
          disabled={isCopyButtonDisabled}
          disabledReason={copyTradeDisabledReason}
          onClick={() => onCopyTrade?.(trader)}
        />
      </div>
    </article>
  );
}
