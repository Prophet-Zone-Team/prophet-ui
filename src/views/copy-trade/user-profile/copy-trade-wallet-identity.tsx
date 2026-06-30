"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { formatShortWallet } from "@/lib/team/detail-format";
import { getWalletAvatarGradient } from "@/lib/wallet/avatar-gradient";

export interface CopyTradeWalletIdentityProps {
  address: string;
  size?: "sm" | "lg";
  showCopy?: boolean;
  className?: string;
  nameClassName?: string;
  trailing?: ReactNode;
}

export function CopyTradeWalletAvatar({
  address,
  size = "sm"
}: {
  address: string;
  size?: "sm" | "lg";
}) {
  return (
    <div
      className={cn(
        "shrink-0 rounded-full border border-white",
        size === "lg" ? "size-[52px]" : "size-8"
      )}
      style={{ background: getWalletAvatarGradient(address) }}
      aria-hidden="true"
    />
  );
}

export function CopyTradeWalletIdentity({
  address,
  size = "sm",
  showCopy = true,
  className,
  nameClassName,
  trailing
}: CopyTradeWalletIdentityProps) {
  const t = useTranslations("wallet");
  const walletLabel = formatShortWallet(address);

  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <CopyTradeWalletAvatar address={address} size={size} />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1">
          <span
            className={cn(
              "truncate text-black",
              size === "lg"
                ? "text-[26px] font-[500] leading-[32px]"
                : "text-[16px] font-medium leading-5",
              nameClassName
            )}
          >
            {walletLabel}
          </span>
        </div>
      </div>
      {trailing}
    </div>
  );
}
