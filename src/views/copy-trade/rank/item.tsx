"use client";

import Popover from "@/components/popover";
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
import { copyTradeTooltipClass } from "@/views/copy-trade/copy-trade-ui";
import {
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
          <PortfolioTableMobileField label={t("profitLoss")} valueClassName={pnlTone}>
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

function CopyTradeButton({
  busy,
  disabled,
  disabledReason,
  onClick
}: {
  busy: boolean;
  disabled: boolean;
  disabledReason: string | null;
  onClick: () => void;
}) {
  const tCommon = useTranslations("copyTrade.common");
  const button = (
    <button
      type="button"
      className={cn(
        "inline-flex h-10 shrink-0 items-center justify-center rounded-lg text-[16px] leading-5",
        "transition-opacity disabled:cursor-not-allowed",
        busy
          ? "w-[84px] border border-prophet-muted bg-transparent text-prophet-foreground opacity-50"
          : cn(
              "w-20 bg-prophet-primary text-prophet-primary-foreground hover:opacity-90",
              disabled && "opacity-30 hover:opacity-30"
            )
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {busy ? tCommon("copying") : tCommon("copy")}
    </button>
  );

  if (disabled && disabledReason) {
    return (
      <Popover
        placement="Top"
        trigger="Hover"
        offset={8}
        contentClassName="z-[12]"
        content={
          <div className={copyTradeTooltipClass}>
            {disabledReason}
          </div>
        }
      >
        <span className="inline-flex">{button}</span>
      </Popover>
    );
  }

  return button;
}
