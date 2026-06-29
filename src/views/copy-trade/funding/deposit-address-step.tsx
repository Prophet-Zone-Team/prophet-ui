"use client";

import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

import { cn } from "@/lib/cn";
import { formatNumber } from "@/utils";
import type { CopyDepositStatusResult } from "@/types/copy-trade-funding";

export interface DepositAddressStepProps {
  address: string;
  loading: boolean;
  status: CopyDepositStatusResult | null;
}

const cardClass = cn(
  "flex flex-col gap-1 rounded-[8px] border border-[#EBEBEB] bg-[#FAFBFC] px-4 py-3",
);

export function DepositAddressStep({
  address,
  loading,
  status,
}: DepositAddressStepProps) {
  const handleCopy = async () => {
    if (!address) {
      return;
    }

    try {
      await navigator.clipboard.writeText(address);
      toast.success("Address copied");
    } catch {
      toast.error("Could not copy address");
    }
  };

  const recentTransactions = status?.transactions ?? [];

  return (
    <div className="relative flex flex-col gap-5 pb-2">
      <p className="text-sm leading-5 text-[#909090]">
        Send any supported stablecoin on a supported EVM network to the address
        below. Funds are bridged automatically and credited to your copy wallet
        as pUSD.
      </p>

      <div className="flex justify-center">
        {loading || !address ? (
          <div
            className="size-[200px] animate-pulse rounded-[12px] bg-[#F1F1F1]"
            aria-hidden="true"
          />
        ) : (
          <div className="rounded-[12px] border border-[#EBEBEB] p-3">
            <QRCodeSVG
              value={address}
              size={200}
              level="M"
              marginSize={2}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-[500] text-black">
          Your deposit address
        </span>
        <div className="flex items-center justify-between gap-3 rounded-[6px] border border-[#EBEBEB] bg-white px-4 py-3">
          {loading || !address ? (
            <div
              className="h-4 w-full animate-pulse rounded bg-[#F1F1F1]"
              aria-hidden="true"
            />
          ) : (
            <p className="min-w-0 flex-1 break-all text-sm font-[500] text-black">
              {address}
            </p>
          )}
          <button
            type="button"
            className="flex shrink-0 items-center gap-1 border-0 bg-transparent p-0 text-sm font-[500] text-[#3168FF] hover:opacity-80 disabled:opacity-50"
            disabled={loading || !address}
            onClick={() => void handleCopy()}
          >
            <img
              src="/icons/icon-copy.svg"
              alt=""
              className="size-3 shrink-0"
              aria-hidden="true"
            />
            Copy
          </button>
        </div>
      </div>

      <div className={cardClass}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#909090]">Credited so far</span>
          <span className="text-sm font-[600] text-black">
            {formatNumber(status?.credited_pusd ?? 0, 2, true, { round: 0 })} pUSD
          </span>
        </div>
        <span className="text-xs text-[#909090]">
          {recentTransactions.length > 0
            ? `${recentTransactions.length} bridge transaction(s) detected. This view refreshes automatically.`
            : "Waiting for an incoming transfer. This view refreshes automatically."}
        </span>
      </div>
    </div>
  );
}
