"use client";

import { Loader2 } from "lucide-react";

import { formatShortWallet } from "@/lib/team/detail-format";
import { cn } from "@/lib/cn";

export type DepositPrivateTransferPhase =
  | "unshielding"
  | "waiting_funder"
  | "converting"
  | "success"
  | "error";

export interface DepositPrivateTransferStatusProps {
  phase: DepositPrivateTransferPhase;
  statusLabel?: string;
  ownerWalletAddress?: string;
  funderAddress?: string;
  error?: string;
  onRetry?: () => void;
}

export function DepositPrivateTransferStatus({
  phase,
  statusLabel,
  ownerWalletAddress,
  funderAddress,
  error,
  onRetry,
}: DepositPrivateTransferStatusProps) {
  const title =
    phase === "success"
      ? "Transfer complete"
      : phase === "error"
        ? "Transfer failed"
        : "Processing private transfer";

  return (
    <div className="flex flex-col items-center gap-4 px-2 py-8 text-center">
      {phase !== "success" && phase !== "error" ? (
        <Loader2 className="h-8 w-8 animate-spin text-[#909090]" aria-hidden />
      ) : null}

      <p className="m-0 text-base font-[556] text-black">{title}</p>

      {statusLabel ? (
        <p className="m-0 text-sm text-[#909090]">{statusLabel}</p>
      ) : null}

      {ownerWalletAddress ? (
        <p className="m-0 text-xs text-[#909090]">
          Owner EOA: {formatShortWallet(ownerWalletAddress)}
        </p>
      ) : null}

      {funderAddress ? (
        <p className="m-0 text-xs text-[#909090]">
          Deposit wallet: {formatShortWallet(funderAddress)}
        </p>
      ) : null}

      {error ? (
        <p className={cn("m-0 text-sm text-prophet-red")}>{error}</p>
      ) : null}

      {onRetry ? (
        <button
          type="button"
          className="mt-2 rounded-lg border border-[#EBEBEB] px-4 py-2 text-sm font-[556] text-black transition-colors hover:border-[#d0d0d0]"
          onClick={onRetry}
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
