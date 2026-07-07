"use client";

import { useTranslations } from "next-intl";

import { TeamFlag } from "@/components/teams/team-flag";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { cn } from "@/lib/cn";
import { translateTradeMessage } from "@/views/trade/trade-widget/trade-i18n";
import {
  strategyCardTableCellClassName,
  strategyCardTableFlagClassName,
  strategyCardTableHeaderClassName
} from "@/views/strategy/components/card/styles";

import { STRATEGY_BID_INVALID_SURFACE_CLASS } from "./constants";
import type { StrategyBidMarketRow } from "./types";

export type MarketBreakdownTableProps = {
  rows: StrategyBidMarketRow[];
  toWinLabel: string;
  className?: string;
};

export function MarketBreakdownTable({
  rows,
  toWinLabel,
  className
}: MarketBreakdownTableProps) {
  const t = useTranslations("strategy");
  const tTrade = useTranslations("trade");

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-center justify-between">
        <span className={strategyCardTableHeaderClassName}>
          {t("tableMarket")}
        </span>
        <span className={cn(strategyCardTableHeaderClassName, "text-right")}>
          {t("traded")}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <MarketBreakdownRow key={row.id} row={row} tTrade={tTrade} />
        ))}
      </div>

      <div className="flex items-end justify-between gap-3 pt-1">
        <span className="font-[Sora] text-sm font-medium leading-[18px] text-prophet-foreground">
          {tTrade("toWin")}
        </span>
        <span className="font-[Sora] text-[26px] font-medium leading-[33px] text-[#69C800]">
          {toWinLabel}
        </span>
      </div>
    </div>
  );
}

function MarketBreakdownRow({
  row,
  tTrade
}: {
  row: StrategyBidMarketRow;
  tTrade: ReturnType<typeof useTranslations<"trade">>;
}) {
  const teamDisplayName = useLocalizedTeamName(row.team.code, row.teamName);

  return (
    <div
      className={cn(
        row.invalid && cn(STRATEGY_BID_INVALID_SURFACE_CLASS, "px-3 py-2.5")
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <TeamFlag
            code={row.team.code}
            name={row.team.name}
            logoUrl={row.team.logoUrl}
            fallback={false}
            className={strategyCardTableFlagClassName}
          />
          <div className="min-w-0">
            <span className={strategyCardTableCellClassName}>
              {teamDisplayName}
            </span>
            {row.invalid && row.invalidReason ? (
              <p className="m-0 mt-0.5 text-xs leading-[16px] text-[#FF674B]">
                {translateTradeMessage(row.invalidReason, tTrade)}
              </p>
            ) : null}
          </div>
        </div>
        <span
          className={cn(
            strategyCardTableCellClassName,
            "shrink-0 text-right font-normal"
          )}
        >
          {row.tradedLabel}
        </span>
      </div>
    </div>
  );
}
