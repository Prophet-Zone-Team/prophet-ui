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
  copyTradeRankPnl7dEnabled,
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
      {copyTradeRankPnl7dEnabled ? (
        <span
          role="columnheader"
          className={cn(copyTradeRankColPnl7dClass, "flex flex-col gap-0.5")}
        >
          <span>{t("pnl7dLabel")}</span>
          <span>{t("fifaPnl7dLabel")}</span>
        </span>
      ) : null}
      <span role="columnheader" className={copyTradeRankColActionClass}>
        {tCommon("action")}
      </span>
    </div>
  );
}
