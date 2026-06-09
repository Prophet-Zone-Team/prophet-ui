"use client";

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

import { formatShortWallet } from "@/lib/team/detail-format";
import { cn } from "@/lib/cn";
import {
  depositBridgeLabelClass,
  depositConnectedRowClass,
  depositConnectedRowHighlightedClass,
  depositSectionLabelClass,
} from "@/views/portfolio/deposit/deposit-ui";
import { WalletAvatarIcon } from "@/views/portfolio/shared/token-icon";
import { useAuthStore } from "@/store";

export interface FundingCryptoEntryProps {
  walletAddress: string;
  connectedBalance: ReactNode;
  connectedBalanceClassName?: string;
  onSelectConnected: () => void;
  onSelectStableflow: () => void;
  stableflowLoading?: boolean;
}

export function FundingCryptoEntry({
  walletAddress,
  connectedBalance,
  connectedBalanceClassName = "text-black",
  onSelectConnected,
  onSelectStableflow,
  stableflowLoading = false,
}: FundingCryptoEntryProps) {
  const loginMethod = useAuthStore((state) => state.loginMethod);

  return (
    <div className="flex flex-col gap-3">
      {
        loginMethod === "wallet" && (
          <>
            <span className={depositSectionLabelClass}>Connected</span>
            <button
              type="button"
              className={depositConnectedRowHighlightedClass}
              onClick={onSelectConnected}
            >
              <span className="flex min-w-0 items-center gap-3">
                <WalletAvatarIcon address={walletAddress} />
                <span className="truncate text-base font-[500] text-black">
                  {formatShortWallet(walletAddress)}
                </span>
              </span>
              <span
                className={cn(
                  "shrink-0 text-base font-[500]",
                  connectedBalanceClassName
                )}
              >
                {connectedBalance}
              </span>
            </button>
          </>
        )
      }

      <span className={depositSectionLabelClass}>Others</span>
      <button
        type="button"
        className={depositConnectedRowClass}
        onClick={() => void onSelectStableflow()}
        disabled={stableflowLoading}
      >
        <span className="flex min-w-0 items-center gap-3">
          {stableflowLoading ? (
            <Loader2
              className="h-5 w-5 animate-spin text-[#909090]"
              aria-hidden="true"
            />
          ) : (
            <img
              src="/logos/logo-stableflow.svg"
              alt=""
              className="size-8 shrink-0 rounded-full object-contain object-center"
            />
          )}
          <span className={depositBridgeLabelClass}>Bridge</span>
        </span>
      </button>
    </div>
  );
}
