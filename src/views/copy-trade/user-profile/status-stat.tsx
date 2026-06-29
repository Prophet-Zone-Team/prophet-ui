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
      </div>
    </div>
  );
}
