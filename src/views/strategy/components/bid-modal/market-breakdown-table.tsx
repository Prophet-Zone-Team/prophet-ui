import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";
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
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-center justify-between">
        <span className={strategyCardTableHeaderClassName}>Market</span>
        <span className={cn(strategyCardTableHeaderClassName, "text-right")}>
          Traded
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <div
            key={row.id}
            className={cn(
              row.invalid &&
                cn(STRATEGY_BID_INVALID_SURFACE_CLASS, "px-3 py-2.5")
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
                    {row.teamName}
                  </span>
                  {row.invalid && row.invalidReason ? (
                    <p className="m-0 mt-0.5 text-xs leading-[16px] text-[#FF674B]">
                      {row.invalidReason}
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
        ))}
      </div>

      <div className="flex items-end justify-between gap-3 pt-1">
        <span className="font-[Sora] text-sm font-medium leading-[18px] text-black">
          To Win
        </span>
        <span className="font-[Sora] text-[26px] font-medium leading-[33px] text-[#69C800]">
          {toWinLabel}
        </span>
      </div>
    </div>
  );
}
