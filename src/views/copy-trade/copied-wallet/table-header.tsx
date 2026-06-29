"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";

import {
  copyTradeCopiedWalletColActionClass,
  copyTradeCopiedWalletColDataClass,
  copyTradeCopiedWalletColWalletClass,
  copyTradeCopiedWalletGridStyle,
  copyTradeCopiedWalletRowGridClass
} from "./grid";

export interface CopyTradeCopiedWalletTableHeaderProps {
  className?: string;
}

export function CopyTradeCopiedWalletTableHeader({
  className
}: CopyTradeCopiedWalletTableHeaderProps) {
  const t = useTranslations("copyTrade.copiedWallet");
  const tCommon = useTranslations("copyTrade.common");

  return (
    <div
      role="row"
      style={copyTradeCopiedWalletGridStyle}
      className={cn(
        copyTradeCopiedWalletRowGridClass,
        "px-4 text-[14px] font-[400] leading-[17px] text-[#909090]",
        className
      )}
    >
      <span
        role="columnheader"
        className={copyTradeCopiedWalletColWalletClass}
      >
        {t("colCopiedWallet")}
      </span>
      <span
        role="columnheader"
        className={copyTradeCopiedWalletColDataClass}
      >
        {t("totalBuy")}
      </span>
      <span
        role="columnheader"
        className={copyTradeCopiedWalletColDataClass}
      >
        {t("totalSell")}
      </span>
      <span
        role="columnheader"
        className={copyTradeCopiedWalletColDataClass}
      >
        {t("buySell")}
      </span>
      <span
        role="columnheader"
        className={copyTradeCopiedWalletColDataClass}
      >
        {t("pnl")}
      </span>
      <span
        role="columnheader"
        className={copyTradeCopiedWalletColDataClass}
      >
        {t("lastTrade")}
      </span>
      <span
        role="columnheader"
        className={copyTradeCopiedWalletColActionClass}
      >
        {tCommon("action")}
      </span>
    </div>
  );
}
