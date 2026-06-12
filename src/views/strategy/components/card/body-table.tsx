"use client";

import { useTranslations } from "next-intl";

import { TeamFlag } from "@/components/teams/team-flag";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { cn } from "@/lib/cn";
import { MarketListMetricLoading } from "@/views/home/home-data-loading";

import {
  strategyCardTableCellClassName,
  strategyCardTableFlagClassName,
  strategyCardTableHeaderClassName
} from "./styles";
import type {
  StrategyCardLegRow,
  StrategyCardOutcomeSide,
  StrategyCardVariant
} from "./types";

export const strategyCardLegsTableGridClass =
  "grid w-full grid-cols-[minmax(128px,1.15fr)_minmax(200px,2.5fr)_minmax(56px,0.55fr)_minmax(72px,0.65fr)_minmax(88px,0.75fr)_minmax(88px,0.75fr)] items-center gap-x-4";

export type StrategyCardBodyTableProps = {
  legs: StrategyCardLegRow[];
  variant?: StrategyCardVariant;
  isLoading?: boolean;
  className?: string;
};

const TABLE_COLUMN_KEYS = [
  "tableTeam",
  "tableMarket",
  "tableSide",
  "tableValue",
  "tableProbability",
  "tableHitReturn"
] as const;

export function StrategyCardBodyTable({
  legs,
  variant = "available",
  isLoading = false,
  className
}: StrategyCardBodyTableProps) {
  const t = useTranslations("strategy");

  if (legs.length === 0) {
    return null;
  }

  return (
    <div className={cn("mx-4 mb-4 overflow-x-auto md:mx-5 md:mb-5", className)}>
      <div
        role="table"
        aria-label={t("strategyLegs")}
        className="min-w-[720px] border border-[#EBEBEB] bg-[#FCFCFC]"
      >
        <div
          role="row"
          className={cn(
            strategyCardLegsTableGridClass,
            strategyCardTableHeaderClassName,
            "px-4 py-3"
          )}
        >
          {TABLE_COLUMN_KEYS.map((columnKey) => (
            <span key={columnKey} role="columnheader">
              {t(columnKey)}
            </span>
          ))}
        </div>

        {legs.map((leg, index) => (
          <StrategyCardLegRow
            key={leg.id ?? `${leg.teamName}-${index}`}
            leg={leg}
            variant={variant}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  );
}

function StrategyCardLegRow({
  leg,
  variant,
  isLoading = false
}: {
  leg: StrategyCardLegRow;
  variant: StrategyCardVariant;
  isLoading?: boolean;
}) {
  const teamDisplayName = useLocalizedTeamName(leg.team.code, leg.teamName);
  const isEnded = variant === "winner" || variant === "loss";
  const isHighlighted = Boolean(leg.isTournamentWinner);
  const isMuted = isEnded && !isHighlighted;

  return (
    <div
      role="row"
      className={cn(
        strategyCardLegsTableGridClass,
        isMuted ? "text-[#909090]" : strategyCardTableCellClassName,
        "h-[52px] px-4",
        isHighlighted && "mx-1 bg-[#65AF1433] rounded-[8px]"
      )}
    >
      <div role="cell" className="flex min-w-0 items-center gap-2">
        <TeamFlag
          code={leg.team.code}
          name={leg.team.name ?? leg.teamName}
          logoUrl={leg.team.logoUrl}
          fallback={false}
          className={strategyCardTableFlagClassName}
        />
        <span className="truncate">{teamDisplayName}</span>
      </div>
      <span role="cell" className="min-w-0 truncate">
        {leg.marketLabel}
      </span>
      <span role="cell">
        <OutcomeSideLabel side={leg.side} muted={isMuted} />
      </span>
      <span role="cell" className="tabular-nums">
        {isLoading ? (
          <MarketListMetricLoading variant="volume" className="h-[18px] w-14" />
        ) : (
          leg.valueLabel
        )}
      </span>
      <span role="cell" className="tabular-nums">
        {isLoading ? (
          <MarketListMetricLoading
            variant="probability"
            className="h-[18px] w-12"
          />
        ) : (
          leg.probabilityLabel
        )}
      </span>
      <span role="cell" className="tabular-nums">
        {isLoading ? (
          <MarketListMetricLoading variant="volume" className="h-[18px] w-16" />
        ) : (
          leg.hitReturnLabel
        )}
      </span>
    </div>
  );
}

function OutcomeSideLabel({
  side,
  muted = false
}: {
  side: StrategyCardOutcomeSide;
  muted?: boolean;
}) {
  const t = useTranslations("common");
  const label = side === "yes" ? t("yes") : t("no");

  return (
    <span
      className={cn(
        "font-[Sora] text-sm font-medium leading-[18px]",
        muted
          ? "text-[#909090]"
          : side === "yes"
            ? "text-[#65AF14]"
            : "text-[#FF674B]"
      )}
    >
      {label}
    </span>
  );
}
