"use client";

import type { MouseEvent, ReactNode } from "react";

import { CopyIcon } from "@/components/icons";
import { useCopyWithToast } from "@/hooks/use-copy-with-toast";
import { cn } from "@/lib/cn";
import {
  isUserImportedTrader,
  traderTag,
  type TraderTag
} from "@/lib/copy-trade/trader-catalog-stats";
import { formatShortWallet } from "@/lib/team/detail-format";
import { getWalletAvatarGradient } from "@/lib/wallet/avatar-gradient";
import type { TraderCatalogEntry } from "@/types/copy-trade-api";

import { SmartMoneyIcon, WhaleIcon } from "./rank/trader-tag-icons";

export function TraderAvatar({
  wallet,
  size = "sm"
}: {
  wallet: string;
  size?: "sm" | "lg";
}) {
  return (
    <div
      className={cn(
        "shrink-0 rounded-full",
        size === "lg" ? "size-[52px]" : "size-9"
      )}
      style={{ background: getWalletAvatarGradient(wallet) }}
      aria-hidden="true"
    />
  );
}

export function TraderBadge({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] leading-[13px]",
        className
      )}
    >
      {children}
    </span>
  );
}

export function TraderTagIcon({ tag }: { tag: TraderTag }) {
  return (
    <span className="inline-flex shrink-0 items-center" aria-hidden="true">
      {tag === "whale" ? <WhaleIcon /> : <SmartMoneyIcon />}
    </span>
  );
}

export interface TraderIdentityProps {
  trader: TraderCatalogEntry;
  size?: "sm" | "lg";
  displayNameClassName?: string;
  showWalletCopy?: boolean;
  className?: string;
}

export function TraderIdentity({
  trader,
  size = "sm",
  displayNameClassName,
  showWalletCopy = true,
  className
}: TraderIdentityProps) {
  const { copy } = useCopyWithToast();
  const displayName = trader.DisplayName || formatShortWallet(trader.Wallet);
  const walletLabel = formatShortWallet(trader.Wallet);
  const imported = isUserImportedTrader(trader);
  const tag = traderTag(trader);

  const handleCopyWallet = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    void copy(trader.Wallet);
  };

  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <TraderAvatar wallet={trader.Wallet} size={size} />
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-1.5">
          <p
            className={cn(
              "truncate text-black",
              size === "lg"
                ? "text-[26px] font-[500] leading-[32px]"
                : "text-[16px] leading-5",
              displayNameClassName
            )}
          >
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
          {showWalletCopy ? (
            <button
              type="button"
              className="inline-flex shrink-0 items-center justify-center p-0.5 text-[#909090] transition-opacity hover:opacity-70"
              aria-label="Copy wallet address"
              onClick={handleCopyWallet}
            >
              <CopyIcon />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function TraderTrackButton({
  tracked,
  onToggle,
  variant = "icon",
  className
}: {
  tracked: boolean;
  onToggle: () => void;
  variant?: "icon" | "button";
  className?: string;
}) {
  if (variant === "button") {
    return (
      <button
        type="button"
        className={cn(
          "inline-flex h-[46px] items-center justify-center gap-2 rounded-xl border border-[#909090] px-4 text-[16px] leading-5 text-black transition-opacity hover:opacity-80",
          tracked ? "opacity-100" : "opacity-50",
          className
        )}
        aria-label={tracked ? "Untrack trader" : "Track trader"}
        aria-pressed={tracked}
        onClick={onToggle}
      >
        {tracked ? <TrackedIcon /> : <UntrackedIcon />}
        <span>Track</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center border-0 bg-transparent p-0 transition-opacity hover:opacity-70",
        className
      )}
      aria-label={tracked ? "Untrack trader" : "Track trader"}
      aria-pressed={tracked}
      onClick={onToggle}
    >
      {tracked ? <TrackedIcon /> : <UntrackedIcon />}
    </button>
  );
}

export function UntrackedIcon() {
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

export function TrackedIcon() {
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
