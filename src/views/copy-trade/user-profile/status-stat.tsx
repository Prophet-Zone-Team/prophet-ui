"use client";

import { useTranslations } from "next-intl";

import {
  isCopyWalletPending,
  isCopyWalletReady,
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

function resolveLocalizedWalletStatusLabel(
  wallet: CopyWallet | null | undefined,
  t: (key: string) => string
): string {
  if (!wallet) {
    return t("notCreated");
  }

  if (isCopyWalletReady(wallet)) {
    return t("running");
  }

  if (wallet.WalletStatus?.toLowerCase() === "pending") {
    return t("deploying");
  }

  if (wallet.WalletStatus?.toLowerCase() === "deployed") {
    return t("awaitingApproval");
  }

  return wallet.WalletStatus || t("unknown");
}

export function StatusStat() {
  const tStatus = useTranslations("copyTrade.walletStatus");
  const tCommon = useTranslations("copyTrade.common");
  const copyWallet = useCopyTradeStore((state) => state.copyWallet);
  const label = resolveLocalizedWalletStatusLabel(copyWallet, tStatus);
  const ready = isCopyWalletReady(copyWallet);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[14px] leading-[18px] text-[#909090]">
        {tCommon("status")}
      </span>
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
