"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";

export interface TracksTableHeaderProps {
  className?: string;
}

export function TracksTableHeader({ className }: TracksTableHeaderProps) {
  const tCommon = useTranslations("copyTrade.common");
  const t = useTranslations("copyTrade.activity");

  return (
    <div
      role="row"
      className={cn(
        "flex items-center justify-between text-[12px] leading-[15px] text-[#909090]",
        className
      )}
    >
      <span role="columnheader">{tCommon("player")}</span>
      <span role="columnheader">{t("pnl24h")}</span>
    </div>
  );
}
