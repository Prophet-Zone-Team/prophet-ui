"use client";

import type { ReactNode } from "react";

import { CopyButton } from "@/components/feedback/copy-button";
import { CopyIcon } from "@/components/icons";
import Popover from "@/components/popover";
import { cn } from "@/lib/cn";
import {
  isUserImportedTrader,
  traderTag,
  type TraderTag
} from "@/lib/copy-trade/trader-catalog-stats";
import {
  resolveTraderRankDisplayStats,
  type CopyTradeRankTimeRange
} from "@/lib/copy-trade/trader-rank-filters";
import { formatCompactVolume } from "@/lib/formatters/volume";
import type { TraderCatalogEntry } from "@/types/copy-trade-api";
import {
  TraderIdentity,
  TraderTrackButton
} from "@/views/copy-trade/trader-identity";

import {
  copyTradeRankColActionClass,
  copyTradeRankColCenterClass,
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
  className
}: CopyTradeRankItemProps) {
  const displayName = trader.DisplayName || formatShortWallet(trader.Wallet);
  const walletLabel = formatShortWallet(trader.Wallet);
  const isCopyButtonDisabled = copyTradeBusy || copyTradeDisabled;
  const stats = resolveTraderRankDisplayStats(trader, timeRange);
  const pnlValue = stats.pnl ?? 0;

  return (
    <article
      style={copyTradeRankGridStyle}
      className={cn(
        "box-border h-[74px] rounded-xl border border-[#EBEBEB] bg-white px-4",
        copyTradeRankRowGridClass,
        className
      )}
    >
      <span
        className={cn(
          copyTradeRankColRankClass,
          "text-[16px] leading-5 text-black tabular-nums"
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
            <p className="truncate text-[16px] leading-5 text-black max-w-[160px]">
              {displayName}
            </p>
            {imported ? (
              <TraderBadge className="bg-[#EBEBEB] text-[#909090]">
                Imported
              </TraderBadge>
            ) : null}
            {tag ? <TraderTagIcon tag={tag} /> : null}
          </div>
          <div className="mt-px flex min-w-0 items-center gap-1">
            <span className="truncate text-[12px] leading-[15px] text-[#909090]">
              {walletLabel}
            </span>
            <CopyButton
              text={trader.Wallet}
              ariaLabel="Copy wallet address"
              className="inline-flex shrink-0 items-center justify-center p-0.5 text-[#909090] transition-opacity hover:opacity-70"
            >
              <CopyIcon />
            </CopyButton>
          </div>
        </div>
      </div>

      <span
        className={cn(
          copyTradeRankColCenterClass,
          "text-[16px] leading-5 text-[#909090] tabular-nums"
        )}
      >
        {formatStatValue(stats.winRate, formatWinRate)}
      </span>
      <span
        className={cn(
          copyTradeRankColCenterClass,
          "text-[16px] leading-5 tabular-nums",
          stats.pnl === null
            ? "text-[#909090]"
            : pnlValue >= 0
              ? "text-[#65AF14]"
              : "text-[#FF674B]"
        )}
      >
        {formatStatValue(stats.pnl, formatSignedCompactUsd)}
      </span>
      <span
        className={cn(
          copyTradeRankColCenterClass,
          "text-[16px] leading-5 text-[#909090] tabular-nums"
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
          "text-[16px] leading-5 text-[#909090]"
        )}
      >
        {formatStatValue(stats.trades, (value) => String(value))}
      </span>

      <div className={copyTradeRankColActionClass}>
        <button
          type="button"
          className="inline-flex size-5 shrink-0 items-center justify-center border-0 bg-transparent p-0 transition-opacity hover:opacity-70"
          aria-label={tracked ? "Untrack trader" : "Track trader"}
          aria-pressed={tracked}
          onClick={() => onTrackToggle?.(trader)}
        >
          {tracked ? <TrackedIcon /> : <UntrackedIcon />}
        </button>

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
  const button = (
    <button
      type="button"
      className={cn(
        "inline-flex h-10 shrink-0 items-center justify-center rounded-lg text-[16px] leading-5",
        "transition-opacity disabled:cursor-not-allowed",
        busy
          ? "w-[84px] border border-[#909090] bg-transparent text-black opacity-50"
          : cn(
              "w-20 bg-black text-white hover:opacity-90",
              disabled && "opacity-30 hover:opacity-30"
            )
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {busy ? "Copying" : "Copy"}
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
          <div className="max-w-[280px] rounded-xl border border-[#EBEBEB] bg-white px-4 py-3 text-sm leading-[150%] text-black shadow-[0px_0px_10px_rgba(0,0,0,0.1)]">
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

function UntrackedIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="18"
      viewBox="0 0 20 18"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M13.6887 0.75C11.7436 0.75 10.3503 2.48836 9.74984 3.40778C9.14872 2.48836 7.75604 0.75 5.81101 0.75C3.01994 0.75 0.75 3.24461 0.75 6.31059C0.75 7.74428 1.73045 9.79959 2.92063 10.8752C4.56702 12.9732 9.19553 16.75 9.76692 16.75C10.3484 16.75 14.8776 13.0466 16.5537 10.9004C17.7648 9.80587 18.75 7.74773 18.75 6.31059C18.75 3.24459 16.4797 0.75 13.6887 0.75Z"
        stroke="#909090"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function TrackedIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="16"
      viewBox="0 0 18 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12.9387 0C10.9936 0 9.6003 1.73836 8.99984 2.65778C8.39872 1.73836 7.00604 0 5.06101 0C2.26994 0 0 2.49461 0 5.56059C0 6.99428 0.980452 9.04959 2.17063 10.1252C3.81702 12.2232 8.44553 16 9.01692 16C9.59841 16 14.1276 12.2966 15.8037 10.1504C17.0148 9.05587 18 6.99773 18 5.56059C18 2.49459 15.7297 0 12.9387 0Z"
        fill="#FF674B"
      />
    </svg>
  );
}
