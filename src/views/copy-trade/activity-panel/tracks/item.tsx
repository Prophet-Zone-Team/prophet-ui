"use client";

import { useState, type MouseEvent } from "react";

import { CopyButton } from "@/components/feedback/copy-button";
import { CopyIcon } from "@/components/icons";
import { useTranslations } from "next-intl";
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
import { CopyTradeButton } from "@/views/copy-trade/copy-trade-button";
import {
  SmartMoneyIcon,
  WhaleIcon
} from "@/views/copy-trade/rank/trader-tag-icons";

export interface TracksItemProps {
  trader: TraderCatalogEntry;
  onCopyTrade?: (trader: TraderCatalogEntry) => void;
  copyTradeBusy?: boolean;
  copyTradeDisabled?: boolean;
  copyTradeDisabledReason?: string | null;
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

  return "text-prophet-muted";
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

export function TracksItem({
  trader,
  onCopyTrade,
  copyTradeBusy = false,
  copyTradeDisabled = false,
  copyTradeDisabledReason = null,
  className
}: TracksItemProps) {
  const tCommon = useTranslations("copyTrade.common");
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const displayName = trader.DisplayName?.trim();
  const walletLabel = formatShortWallet(trader.Wallet);
  const tag = traderTag(trader);
  const pnl24h = traderPnL24h(trader);
  const isCopyButtonDisabled = copyTradeBusy || copyTradeDisabled;

  const handleRowClick = (event: MouseEvent<HTMLElement>) => {
    if (window.matchMedia("(min-width: 768px)").matches) {
      return;
    }

    if ((event.target as HTMLElement).closest("button")) {
      return;
    }

    setMobileExpanded((prev) => !prev);
  };

  return (
    <article
      className={cn(
        "group flex cursor-pointer items-center justify-between gap-3 md:cursor-default",
        className
      )}
      onClick={handleRowClick}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <TraderAvatar wallet={trader.Wallet} />
        <div>
          <div className="flex items-center gap-2">
            <p className="max-w-[150px] truncate text-[16px] leading-5 text-prophet-foreground">
              {displayName}
            </p>
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

      <div className="relative min-w-[77px] shrink-0">
        <span
          className={cn(
            "text-[14px] leading-[18px] tabular-nums",
            pnlToneClass(pnl24h),
            mobileExpanded && "invisible",
            "md:group-hover:invisible"
          )}
        >
          {formatPnl24h(pnl24h)}
        </span>

        <div
          className={cn(
            "absolute inset-0 hidden items-center justify-end",
            mobileExpanded && "flex",
            "md:group-hover:flex"
          )}
        >
          <CopyTradeButton
            busy={copyTradeBusy}
            disabled={isCopyButtonDisabled}
            disabledReason={copyTradeDisabledReason}
            size="compact"
            onClick={(event) => {
              event.stopPropagation();
              onCopyTrade?.(trader);
            }}
          />
        </div>
      </div>
    </article>
  );
}
