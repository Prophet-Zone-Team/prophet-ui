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
import {
  copyTradeListMobileFieldLabelClass,
  copyTradeListMobileFieldValueClass,
  copyTradeListTextClass,
  copyTradeTableMobileCardClass
} from "@/views/copy-trade/copy-trade-ui";
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
  copyTradeRankPnl7dEnabled,
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

function resolveTraderFifaBuyCount(trader: TraderCatalogEntry): number | null {
  const value = trader.FifaBuyCount;
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

function Pnl7dDualValue({
  pnl7d,
  fifaPnl7d,
  variant = "stacked"
}: {
  pnl7d: number | null;
  fifaPnl7d: number | null;
  variant?: "stacked" | "inline";
}) {
  if (variant === "inline") {
    return (
      <span className="inline-flex min-w-0 items-center gap-0.5 text-[14px] leading-[17px] tabular-nums">
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

  return (
    <span className="inline-flex min-w-0 flex-col gap-0.5 text-[14px] leading-[17px] tabular-nums">
      <span className={pnlToneClass(pnl7d)}>
        {formatStatValue(pnl7d, formatSignedCompactUsd)}
      </span>
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
  const fifaBuyCount = resolveTraderFifaBuyCount(trader);
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
          <span
            className={cn(
              "inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-prophet-action-panel text-prophet-foreground tabular-nums",
              copyTradeListTextClass
            )}
          >
            {rank}
          </span>
          <TraderIdentity
            trader={trader}
            className="min-w-0 flex-1"
            displayNameClassName={copyTradeListTextClass}
            walletLabelClassName={copyTradeListTextClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <PortfolioTableMobileField
            label={t("winRate")}
            labelClassName={copyTradeListMobileFieldLabelClass}
            valueClassName={copyTradeListMobileFieldValueClass}
          >
            {formatStatValue(stats.winRate, formatWinRate)}
          </PortfolioTableMobileField>
          <PortfolioTableMobileField
            label={t("profitLoss")}
            labelClassName={copyTradeListMobileFieldLabelClass}
            valueClassName={cn(copyTradeListMobileFieldValueClass, pnlTone)}
          >
            {formatStatValue(stats.pnl, formatSignedCompactUsd)}
          </PortfolioTableMobileField>
          <PortfolioTableMobileField
            label={t("volume")}
            labelClassName={copyTradeListMobileFieldLabelClass}
            valueClassName={copyTradeListMobileFieldValueClass}
          >
            {formatStatValue(
              stats.volume,
              (value) => formatCompactVolume(value) ?? "$0"
            )}
          </PortfolioTableMobileField>
          <PortfolioTableMobileField
            label={t("predictions")}
            labelClassName={copyTradeListMobileFieldLabelClass}
            valueClassName={copyTradeListMobileFieldValueClass}
          >
            {formatStatValue(fifaBuyCount, (value) => String(value))}
          </PortfolioTableMobileField>
          {copyTradeRankPnl7dEnabled ? (
            <div className="col-span-2">
              <PortfolioTableMobileField
                label={t("pnl7d")}
                inline
                labelClassName={cn(
                  copyTradeListMobileFieldLabelClass,
                  "shrink-0 whitespace-nowrap"
                )}
                valueClassName={cn(copyTradeListTextClass, "tabular-nums")}
              >
                <Pnl7dDualValue
                  pnl7d={pnl7d}
                  fifaPnl7d={fifaPnl7d}
                  variant="inline"
                />
              </PortfolioTableMobileField>
            </div>
          ) : null}
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
          copyTradeListTextClass,
          "text-prophet-foreground tabular-nums"
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
            <p
              className={cn(
                "max-w-[160px] truncate text-prophet-foreground",
                copyTradeListTextClass
              )}
            >
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
            <span
              className={cn(
                "truncate text-prophet-muted",
                copyTradeListTextClass
              )}
            >
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
          copyTradeListTextClass,
          "text-prophet-muted tabular-nums"
        )}
      >
        {formatStatValue(stats.winRate, formatWinRate)}
      </span>
      <span
        className={cn(
          copyTradeRankColStatClass,
          copyTradeListTextClass,
          "tabular-nums",
          pnlTone
        )}
      >
        {formatStatValue(stats.pnl, formatSignedCompactUsd)}
      </span>
      <span
        className={cn(
          copyTradeRankColStatClass,
          copyTradeListTextClass,
          "text-prophet-muted tabular-nums"
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
          copyTradeListTextClass,
          "text-prophet-muted"
        )}
      >
        {formatStatValue(fifaBuyCount, (value) => String(value))}
      </span>
      {copyTradeRankPnl7dEnabled ? (
        <span className={copyTradeRankColPnl7dClass}>
          <Pnl7dDualValue pnl7d={pnl7d} fifaPnl7d={fifaPnl7d} />
        </span>
      ) : null}

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
