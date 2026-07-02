"use client";

import { useTranslations } from "next-intl";

import { copyTradePrimaryButtonClass } from "@/views/copy-trade/copy-trade-ui";
import {
  openCopyTradeDeposit,
  openCopyTradeWithdraw,
} from "@/store/copy-trade-funding-store";
import { cn } from "@/lib/cn";

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
        className={cn(actionButtonClass, copyTradePrimaryButtonClass, "flex-1")}
        onClick={() => openCopyTradeDeposit()}
      >
        {t("deposit")}
      </button>
      <button
        type="button"
        className={cn(
          actionButtonClass,
          "border border-prophet-muted bg-prophet-panel text-prophet-foreground"
        )}
        onClick={() => openCopyTradeWithdraw()}
      >
        {t("withdraw")}
      </button>
    </div>
  );
}
