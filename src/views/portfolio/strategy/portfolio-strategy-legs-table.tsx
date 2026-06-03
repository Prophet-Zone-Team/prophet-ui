"use client";

import { useEffect, useMemo } from "react";
import { Zap } from "lucide-react";

import { FastBidButton } from "@/components/trading/fast-bid-button";
import { TeamFlag } from "@/components/teams/team-flag";
import curatedTeams from "@/data/teams";
import { cn } from "@/lib/cn";
import {
  formatPortfolioDateTime,
  formatPnlSubline,
  getOutcomeToneClass
} from "@/lib/portfolio/portfolio-format";
import { resolveTeamSnapshot } from "@/lib/strategy/strategy-bid-validation";
import { isTeamFastBidReady } from "@/lib/trading/run-fast-bid";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import { useWinnerSnapshots, useWinnerTeamsStore } from "@/store";
import { PortfolioTableMobileField } from "@/views/portfolio/portfolio-table-mobile";
import {
  portfolioTableMobileCardClass,
  portfolioTableMobileListClass
} from "@/views/portfolio/portfolio-ui";
import { strategyCardTableFlagClassName } from "@/views/strategy/components/card/styles";

import type { PortfolioStrategyLeg } from "./types";

const LEGS_TABLE_GRID =
  "grid w-full grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))] items-center gap-x-3";

const LEGS_TABLE_HEAD_CLASS = cn(
  LEGS_TABLE_GRID,
  "border-b border-[#EBEBEB] px-4 py-2 font-[Sora] text-sm font-normal leading-[18px] text-[#909090]"
);

const LEGS_TABLE_ROW_CLASS = cn(
  LEGS_TABLE_GRID,
  "group px-4 py-3 font-[Sora] text-sm font-medium leading-[18px] text-black"
);

const LEGS_TABLE_ROW_HOVER_CLASS = "transition-colors hover:bg-[#FF674B26]";

const LEGS_TABLE_HOVER_MUTED_CELL_CLASS =
  "tabular-nums group-hover:text-[#909090]";

const LEGS_TABLE_BID_AGAIN_BUTTON_CLASS =
  "inline-flex h-[32px] min-w-[96px] items-center justify-center gap-1 rounded-lg bg-[#18110F] px-2 text-xs font-medium leading-[15px] text-white disabled:cursor-wait disabled:opacity-70";

export type PortfolioStrategyLegsTableProps = {
  legs: PortfolioStrategyLeg[];
  className?: string;
};

export function PortfolioStrategyLegsTable({
  legs,
  className
}: PortfolioStrategyLegsTableProps) {
  if (legs.length === 0) {
    return null;
  }

  return (
    <div className={cn("bg-[#FCFCFC]", className)}>
      <div className="hidden min-w-[720px] md:block">
        <div className={LEGS_TABLE_HEAD_CLASS} role="row">
          <span role="columnheader">Market</span>
          <span role="columnheader">Traded</span>
          <span role="columnheader">To Win</span>
          <span role="columnheader">Value</span>
          <span role="columnheader">Time</span>
        </div>

        {legs.map((leg) => (
          <PortfolioStrategyLegRow key={leg.id} leg={leg} />
        ))}
      </div>

      <div className={portfolioTableMobileListClass}>
        {legs.map((leg) => (
          <PortfolioStrategyLegMobileCard key={`${leg.id}-mobile`} leg={leg} />
        ))}
      </div>
    </div>
  );
}

function isLegTeamEliminated(teamName?: string): boolean {
  if (!teamName) {
    return false;
  }

  const entry = Object.values(curatedTeams).find(
    (team) => team.name === teamName
  );

  return entry != null && "eliminated" in entry && entry.eliminated === true;
}

function PortfolioStrategyLegRow({ leg }: { leg: PortfolioStrategyLeg }) {
  const pnlTone = leg.cashPnl >= 0 ? "text-[#65AF14]" : "text-[#FF674B]";
  const sideLabel = leg.side === "yes" ? "Yes" : "No";
  const eliminated = isLegTeamEliminated(leg.team.name);

  return (
    <div
      className={cn(
        LEGS_TABLE_ROW_CLASS,
        !eliminated && LEGS_TABLE_ROW_HOVER_CLASS
      )}
      role="row"
    >
      <PortfolioStrategyMarketCell
        leg={leg}
        sideLabel={sideLabel}
        tradedAmountLabel={formatTeamDetailMoney(leg.tradedAmount)}
      />
      <span role="cell" className={LEGS_TABLE_HOVER_MUTED_CELL_CLASS}>
        {formatTeamDetailMoney(leg.tradedAmount)}
      </span>
      <span role="cell" className={LEGS_TABLE_HOVER_MUTED_CELL_CLASS}>
        {formatTeamDetailMoney(leg.toWinAmount)}
      </span>
      <div
        role="cell"
        className="flex flex-col gap-0.5 group-hover:text-[#909090]"
      >
        <span className="tabular-nums">
          {formatTeamDetailMoney(leg.currentValue)}
        </span>
        <span className={cn("text-xs font-normal tabular-nums", pnlTone)}>
          {formatPnlSubline(leg.cashPnl, leg.percentPnl)}
        </span>
      </div>
      <PortfolioStrategyLegTimeCell leg={leg} />
    </div>
  );
}

function PortfolioStrategyLegMobileCard({
  leg
}: {
  leg: PortfolioStrategyLeg;
}) {
  const pnlTone = leg.cashPnl >= 0 ? "text-[#65AF14]" : "text-[#FF674B]";
  const sideLabel = leg.side === "yes" ? "Yes" : "No";
  const eliminated = isLegTeamEliminated(leg.team.name);

  return (
    <article
      className={cn(
        portfolioTableMobileCardClass,
        "group transition-colors",
        !eliminated && LEGS_TABLE_ROW_HOVER_CLASS
      )}
    >
      <PortfolioStrategyMarketCell
        leg={leg}
        sideLabel={sideLabel}
        tradedAmountLabel={formatTeamDetailMoney(leg.tradedAmount)}
      />
      <div className="grid grid-cols-2 gap-2 group-hover:text-[#909090]">
        <PortfolioTableMobileField label="Traded">
          {formatTeamDetailMoney(leg.tradedAmount)}
        </PortfolioTableMobileField>
        <PortfolioTableMobileField label="To Win">
          {formatTeamDetailMoney(leg.toWinAmount)}
        </PortfolioTableMobileField>
        <PortfolioTableMobileField label="Value">
          <div className="flex flex-col items-end gap-0.5">
            <span>{formatTeamDetailMoney(leg.currentValue)}</span>
            <span className={cn("text-xs font-normal", pnlTone)}>
              {formatPnlSubline(leg.cashPnl, leg.percentPnl)}
            </span>
          </div>
        </PortfolioTableMobileField>
        <PortfolioTableMobileField
          label="Time"
          valueClassName="font-normal text-prophet-muted"
        >
          <PortfolioStrategyLegTimeCell leg={leg} align="end" />
        </PortfolioTableMobileField>
      </div>
    </article>
  );
}

function PortfolioStrategyLegTimeCell({
  leg,
  align = "start"
}: {
  leg: PortfolioStrategyLeg;
  align?: "start" | "end";
}) {
  const snapshots = useWinnerSnapshots();
  const fetchEvent = useWinnerTeamsStore((state) => state.fetchEvent);
  const eliminated = isLegTeamEliminated(leg.team.name);
  const amount = leg.currentValue;

  useEffect(() => {
    void fetchEvent();
  }, [fetchEvent]);

  const snapshot = useMemo(
    () => resolveTeamSnapshot(leg.team.name ?? "", snapshots),
    [leg.team.name, snapshots]
  );

  const bidReady = useMemo(
    () => (snapshot ? isTeamFastBidReady(snapshot, amount) : false),
    [snapshot, amount]
  );

  const showBidAgainOnHover = !eliminated && snapshot != null;

  return (
    <div
      role="cell"
      className={cn("min-h-[32px]", align === "end" && "flex justify-end")}
    >
      <span
        className={cn(
          "font-normal tabular-nums",
          showBidAgainOnHover && "group-hover:hidden"
        )}
      >
        {formatPortfolioDateTime(leg.tradedAt)}
      </span>
      {showBidAgainOnHover ? (
        <div
          className={cn(
            "hidden group-hover:block",
            align === "end" && "ml-auto"
          )}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <FastBidButton
            snapshot={snapshot}
            amount={amount}
            disabled={!bidReady}
            className={LEGS_TABLE_BID_AGAIN_BUTTON_CLASS}
            showAmount={false}
          >
            Bid Again
          </FastBidButton>
        </div>
      ) : null}
    </div>
  );
}

function PortfolioStrategyMarketCell({
  leg,
  sideLabel,
  tradedAmountLabel
}: {
  leg: PortfolioStrategyLeg;
  sideLabel: string;
  tradedAmountLabel: string;
}) {
  return (
    <div role="cell" className="flex min-w-0 items-start gap-2">
      <TeamFlag
        code={leg.team.code}
        name={leg.team.name}
        logoUrl={leg.team.logoUrl}
        fallback={false}
        className={strategyCardTableFlagClassName}
      />
      <div className="min-w-0">
        <p className="m-0 truncate font-medium text-black group-hover:text-[#909090]">
          {leg.marketTitle}
        </p>
        <p
          className={cn(
            "m-0 mt-0.5 text-xs font-medium leading-[15px]",
            getOutcomeToneClass(sideLabel)
          )}
        >
          {sideLabel} {tradedAmountLabel}
        </p>
      </div>
    </div>
  );
}
