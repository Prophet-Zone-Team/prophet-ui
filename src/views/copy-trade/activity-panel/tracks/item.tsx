"use client";

import { CopyButton } from "@/components/feedback/copy-button";
import { CopyIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import {
  traderPnL24h,
  traderTag,
  type TraderTag
} from "@/lib/copy-trade/trader-catalog-stats";
import { formatCompactVolume } from "@/lib/formatters/volume";
import { formatShortWallet } from "@/lib/team/detail-format";
import { getWalletAvatarGradient } from "@/lib/wallet/avatar-gradient";
import type { TraderCatalogEntry } from "@/types/copy-trade-api";
import {
  SmartMoneyIcon,
  WhaleIcon
} from "@/views/copy-trade/rank/trader-tag-icons";

export interface TracksItemProps {
  trader: TraderCatalogEntry;
  className?: string;
}

function formatPnl24h(value: number): string {
  const formatted = formatCompactVolume(Math.abs(value)) ?? "$0";
  if (value > 0) {
    return formatted;
  }

  if (value < 0) {
    return `-${formatted}`;
  }

  return formatted;
}

function pnlToneClass(value: number): string {
  if (value > 0) {
    return "text-[#65AF14]";
  }

  if (value < 0) {
    return "text-[#FF674B]";
  }

  return "text-[#909090]";
}

function TraderAvatar({ wallet }: { wallet: string }) {
  return (
    <div
      className="size-9 shrink-0 rounded-full"
      style={{ background: getWalletAvatarGradient(wallet) }}
      aria-hidden="true"
    />
  );
}

function TraderTagIcon({ tag }: { tag: TraderTag }) {
  return (
    <span className="inline-flex shrink-0 items-center" aria-hidden="true">
      {tag === "whale" ? <WhaleIcon /> : <SmartMoneyIcon />}
    </span>
  );
}

export function TracksItem({ trader, className }: TracksItemProps) {
  const displayName = trader.DisplayName?.trim();
  const walletLabel = formatShortWallet(trader.Wallet);
  const tag = traderTag(trader);
  const pnl24h = traderPnL24h(trader);

  return (
    <article
      className={cn("flex items-center justify-between gap-3", className)}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <TraderAvatar wallet={trader.Wallet} />
        <div>
          <div className="flex items-center gap-2">
            <p className="truncate text-[16px] leading-5 text-black">
              {displayName}
            </p>
            <div className="flex shrink-0 items-center gap-1.5">
              {tag ? <TraderTagIcon tag={tag} /> : null}
              <CopyButton
                text={trader.Wallet}
                ariaLabel="Copy wallet address"
                className="inline-flex shrink-0 items-center justify-center p-0 text-[#909090] transition-opacity hover:opacity-70"
              >
                <CopyIcon />
              </CopyButton>
            </div>
          </div>
          <p className="mt-px truncate text-[12px] leading-[15px] text-[#909090]">
            {walletLabel}
          </p>
        </div>
      </div>

      <span
        className={cn(
          "shrink-0 text-[14px] leading-[18px] tabular-nums",
          pnlToneClass(pnl24h)
        )}
      >
        {formatPnl24h(pnl24h)}
      </span>
    </article>
  );
}
