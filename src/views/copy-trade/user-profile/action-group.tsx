"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import {
  openCopyTradeDeposit,
  openCopyTradeWithdraw,
} from "@/store/copy-trade-funding-store";

export interface ActionGroupProps {
  className?: string;
}

const actionButtonClass =
  "inline-flex h-10 flex-1 items-center justify-center rounded-lg text-[16px] leading-5 transition-opacity hover:opacity-90";

export function ActionGroup({ className }: ActionGroupProps) {
  const t = useTranslations("copyTrade.profile");

  return (
    <div className={cn("flex gap-3", className)}>
      <button
        type="button"
        className={cn(actionButtonClass, "bg-black text-white")}
        onClick={() => openCopyTradeDeposit()}
      >
        {t("deposit")}
      </button>
      <button
        type="button"
        className={cn(
          actionButtonClass,
          "border border-[#909090] bg-white text-black"
        )}
        onClick={() => openCopyTradeWithdraw()}
      >
        {t("withdraw")}
      </button>
    </div>
  );
}
