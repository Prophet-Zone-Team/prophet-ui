"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";

import {
  copyTradeRankColActionClass,
  copyTradeRankColPnl7dClass,
  copyTradeRankColStatClass,
  copyTradeRankColPlayerClass,
  copyTradeRankColPredictionsClass,
  copyTradeRankColRankClass,
  copyTradeRankGridStyle,
  copyTradeRankRowGridClass
} from "./grid";

export interface CopyTradeRankTableHeaderProps {
  className?: string;
}

export function CopyTradeRankTableHeader({
  className
}: CopyTradeRankTableHeaderProps) {
  const t = useTranslations("copyTrade.rank");
  const tCommon = useTranslations("copyTrade.common");

  return (
    <div
      role="row"
      style={copyTradeRankGridStyle}
      className={cn(
        copyTradeRankRowGridClass,
        "px-4 text-[14px] font-[400] leading-[17px] text-prophet-muted",
        className
      )}
    >
      <span role="columnheader" className={copyTradeRankColRankClass}>
        #
      </span>
      <span role="columnheader" className={copyTradeRankColPlayerClass}>
        {tCommon("player")}
      </span>
      <span role="columnheader" className={copyTradeRankColStatClass}>
        {t("winRate")}
      </span>
      <span role="columnheader" className={copyTradeRankColStatClass}>
        {t("profitLoss")}
      </span>
      <span role="columnheader" className={copyTradeRankColStatClass}>
        {t("volume")}
      </span>
      <span role="columnheader" className={copyTradeRankColPredictionsClass}>
        {t("predictions")}
      </span>
      <span role="columnheader" className={copyTradeRankColPnl7dClass}>
        {t("pnl7dLabel")}
      </span>
      <span role="columnheader" className={copyTradeRankColActionClass}>
        {tCommon("action")}
      </span>
    </div>
  );
}
