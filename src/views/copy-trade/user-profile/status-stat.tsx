"use client";

import {
  isCopyWalletPending,
  isCopyWalletReady,
  resolveCopyWalletStatusLabel
} from "@/lib/copy-trade/auth";
import { useCopyTradeStore } from "@/store/copy-trade-store";
import type { CopyWallet } from "@/types/copy-trade-api";

function statusColorClass(wallet: CopyWallet | null): string {
  if (isCopyWalletReady(wallet)) {
    return "bg-[#65AF14]";
  }

  if (isCopyWalletPending(wallet)) {
    return "bg-[#3168FF]";
  }

  return "bg-[#EBEBEB]";
}

export function StatusStat() {
  const copyWallet = useCopyTradeStore((state) => state.copyWallet);
  const label = resolveCopyWalletStatusLabel(copyWallet);
  const ready = isCopyWalletReady(copyWallet);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[14px] leading-[18px] text-[#909090]">Status</span>
      <div className="flex items-center gap-2">
        <span
          className={`size-2.5 shrink-0 rounded-full ${statusColorClass(copyWallet)}`}
          aria-hidden="true"
        />
        <span
          className={`text-[16px] leading-5 ${ready ? "text-black" : "text-[#909090]"}`}
        >
          {label}
        </span>
        <div
          className={`relative h-5 w-[36px] shrink-0 rounded-[10px] ${ready ? "bg-[#65AF14]" : "bg-[#EBEBEB]"}`}
          aria-hidden="true"
        >
          <span
            className={`absolute top-1/2 size-4 -translate-y-1/2 rounded-full border border-[#EAEAEA] bg-white ${
              ready ? "right-0.5" : "left-0.5"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
