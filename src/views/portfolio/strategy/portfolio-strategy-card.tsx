"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/cn";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";

import { PORTFOLIO_STRATEGY_STATUS_CONFIG } from "@/lib/strategy/portfolio-strategy-status";

import { PortfolioStrategyLegsTable } from "./portfolio-strategy-legs-table";
import type { PortfolioStrategyRecord } from "./types";

const SUMMARY_GRID =
  "grid w-full grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))_2.25rem] items-center gap-x-3";

const SUMMARY_LABEL_CLASS =
  "font-[Sora] text-sm font-normal leading-normal text-[#909090]";

const SUMMARY_VALUE_CLASS =
  "font-[Sora] text-base font-normal capitalize leading-5 text-black";

export type PortfolioStrategyCardProps = {
  strategy: PortfolioStrategyRecord;
  defaultExpanded?: boolean;
  onStrategyUpdated?: () => void;
  className?: string;
};

export function PortfolioStrategyCard({
  strategy,
  defaultExpanded = true,
  onStrategyUpdated,
  className
}: PortfolioStrategyCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const statusDisplay = PORTFOLIO_STRATEGY_STATUS_CONFIG[strategy.status];

  return (
    <article
      className={cn("overflow-hidden border-b border-[#EBEBEB]", className)}
      aria-label={strategy.name}
    >
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <div
            className={cn(SUMMARY_GRID, "bg-transparent px-4 pb-2 pt-4")}
            role="row"
          >
            <span className={SUMMARY_LABEL_CLASS} role="columnheader">
              Strategy
            </span>
            <span className={SUMMARY_LABEL_CLASS} role="columnheader">
              ROI
            </span>
            <span className={SUMMARY_LABEL_CLASS} role="columnheader">
              Value
            </span>
            <span className={SUMMARY_LABEL_CLASS} role="columnheader">
              Hit Return
            </span>
            <span className={SUMMARY_LABEL_CLASS} role="columnheader">
              Status
            </span>
            <div aria-hidden />
          </div>
          <div className={cn(SUMMARY_GRID, "bg-white px-4 pb-4")}>
            <h3 className="m-0 min-w-0 truncate font-[Sora] text-base font-semibold capitalize leading-5 text-black">
              {strategy.name}
            </h3>
            <span className={SUMMARY_VALUE_CLASS}>{strategy.roiLabel}</span>
            <span className={SUMMARY_VALUE_CLASS}>
              {formatTeamDetailMoney(strategy.value)}
            </span>
            <span className={SUMMARY_VALUE_CLASS}>
              {strategy.hitReturnLabel}
            </span>
            <PortfolioStrategyStatus
              label={strategy.statusLabel}
              color={statusDisplay.color}
            />
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              aria-expanded={expanded}
              aria-label={
                expanded ? "Collapse strategy legs" : "Expand strategy legs"
              }
              className={cn(
                "inline-flex size-9 shrink-0 items-center justify-center rounded-lg",
                "border border-[#EBEBEB] bg-white text-black transition-colors hover:bg-[#fafafa]"
              )}
            >
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 transition-transform duration-200",
                  expanded && "rotate-180"
                )}
                aria-hidden
              />
            </button>
          </div>
        </div>
      </div>

      {expanded ? (
        <PortfolioStrategyLegsTable
          legs={strategy.legs}
          strategyId={strategy.id}
          onStrategyUpdated={onStrategyUpdated}
        />
      ) : null}
    </article>
  );
}

function PortfolioStrategyStatus({
  label,
  color
}: {
  label: string;
  color: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span
        className="font-[Sora] text-base font-normal capitalize leading-5"
        style={{ color }}
      >
        {label}
      </span>
    </div>
  );
}
