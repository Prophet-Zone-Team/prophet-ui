"use client";

import { cn } from "@/lib/cn";
import { formatCompactRelativeTime } from "@/lib/formatters/datetime";
import {
  formatPnlSubline,
  formatSharePrice
} from "@/lib/portfolio/portfolio-format";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";

import { copyWalletPositionsGridClass } from "./grid";
import { CopyWalletPositionMarketCell } from "./market-cell";
import type { CopyWalletPositionDisplay } from "./types";

export interface CopyWalletPositionRowProps {
  position: CopyWalletPositionDisplay;
  className?: string;
}

export function CopyWalletPositionRow({
  position,
  className
}: CopyWalletPositionRowProps) {
  const pnlTone =
    position.cashPnl >= 0 ? "text-[#65AF14]" : "text-[#FF674B]";
  const timeLabel = formatCompactRelativeTime(position.lastTradeAt) || "--";

  return (
    <div
      className={cn(
        copyWalletPositionsGridClass,
        "border-t border-[#EBEBEB] px-4 py-3",
        className
      )}
    >
      <CopyWalletPositionMarketCell
        title={position.title}
        outcome={position.outcome}
        priceLabel={formatSharePrice(position.avgPrice)}
        shares={position.shares}
        icon={position.icon}
      />
      <span className="text-[14px] leading-[18px] text-black tabular-nums">
        {formatSharePrice(position.avgPrice)}
      </span>
      <span className="text-[14px] leading-[18px] text-black tabular-nums">
        {formatSharePrice(position.currentPrice)}
      </span>
      <div className="flex flex-col items-start gap-0.5">
        <span className="text-[14px] leading-[18px] text-black tabular-nums">
          {formatTeamDetailMoney(position.currentValue)}
        </span>
        <span className={cn("text-[12px] leading-[15px] tabular-nums", pnlTone)}>
          {formatPnlSubline(position.cashPnl, position.percentPnl)}
        </span>
      </div>
      <span className="justify-self-end text-right text-[14px] leading-[18px] text-black tabular-nums">
        {timeLabel}
      </span>
    </div>
  );
}
