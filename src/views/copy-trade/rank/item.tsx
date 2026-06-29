"use client";

import { cn } from "@/lib/cn";
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
  className
}: CopyTradeRankItemProps) {
  const isCopyButtonDisabled = copyTradeBusy || copyTradeDisabled;
  const stats = resolveTraderRankDisplayStats(trader, timeRange);
  const pnlValue = stats.pnl ?? 0;

  return (
    <article
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

      <div className={cn(copyTradeRankColPlayerClass, "flex items-center gap-3")}>
        <TraderIdentity trader={trader} />
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

      <div
        className={cn(copyTradeRankColActionClass, "flex items-center gap-2")}
      >
        <TraderTrackButton
          tracked={tracked}
          onToggle={() => onTrackToggle?.(trader)}
        />

        <button
          type="button"
          className={cn(
            "inline-flex h-10 shrink-0 items-center justify-center rounded-lg text-[16px] leading-5",
            "transition-opacity disabled:cursor-not-allowed",
            copyTradeBusy
              ? "w-[84px] border border-[#909090] bg-transparent text-black opacity-50"
              : cn(
                  "w-20 bg-black text-white hover:opacity-90",
                  copyTradeDisabled && "opacity-30 hover:opacity-30"
                )
          )}
          disabled={isCopyButtonDisabled}
          onClick={() => onCopyTrade?.(trader)}
        >
          {copyTradeBusy ? "Copying" : "Copy"}
        </button>
      </div>
    </article>
  );
}
