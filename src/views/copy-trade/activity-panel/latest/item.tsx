"use client";

import { cn } from "@/lib/cn";
import {
  formatOrderbookPrice,
  formatShareSize
} from "@/lib/market/order-math";
import { formatShortWallet } from "@/lib/team/detail-format";
import { getWalletAvatarGradient } from "@/lib/wallet/avatar-gradient";
import type { CopyTraderTrackLatestItem } from "@/types/copy-trade-api";

export interface LatestItemProps {
  item: CopyTraderTrackLatestItem;
  now?: number;
  className?: string;
}

function formatShortRelativeTime(timestampMs: number, now: number): string {
  const diffMs = Math.max(0, now - timestampMs);
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) {
    return `${diffSec}s`;
  }

  const diffMin = Math.floor(diffSec / 60);

  if (diffMin < 60) {
    return `${diffMin}m`;
  }

  const diffHour = Math.floor(diffMin / 60);

  if (diffHour < 24) {
    return `${diffHour}h`;
  }

  return `${Math.floor(diffHour / 24)}d`;
}

function resolveDisplayName(item: CopyTraderTrackLatestItem): string {
  const name = item.display_name?.trim();
  return name || formatShortWallet(item.wallet);
}

function formatTradeDetail(item: CopyTraderTrackLatestItem): string {
  const outcome = item.outcome?.trim() || item.side;
  const price = formatOrderbookPrice(item.price);
  const shares = formatShareSize(item.size);
  return `${outcome} ${price} ${shares} shares`;
}

function tradeDetailToneClass(side: string): string {
  return side.toUpperCase() === "SELL" ? "text-[#FF674B]" : "text-[#65AF14]";
}

function TraderAvatar({ wallet }: { wallet: string }) {
  return (
    <div
      className="mt-px size-5 shrink-0 rounded-full"
      style={{ background: getWalletAvatarGradient(wallet) }}
      aria-hidden="true"
    />
  );
}

export function LatestItem({ item, now = Date.now(), className }: LatestItemProps) {
  const displayName = resolveDisplayName(item);
  const title = item.title?.trim() || "Unknown market";
  const tradeDetail = formatTradeDetail(item);
  const relativeTime = formatShortRelativeTime(item.timestamp, now);

  return (
    <article className={cn("flex gap-2", className)}>
      <TraderAvatar wallet={item.wallet} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[12px] leading-[15px] text-black">
            {displayName}
          </p>
          <span className="shrink-0 text-[12px] leading-[15px] text-[#77A4EF]">
            {relativeTime}
          </span>
        </div>

        <p className="truncate text-[14px] leading-[18px] text-black">
          {title}
        </p>

        <p
          className={cn(
            "truncate text-[12px] leading-[15px]",
            tradeDetailToneClass(item.side)
          )}
        >
          {tradeDetail}
        </p>
      </div>
    </article>
  );
}
