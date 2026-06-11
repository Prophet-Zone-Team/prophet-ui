"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";
import { MarketListMetricLoading } from "@/views/home/home-data-loading";

import {
  strategyCardDescriptionClassName,
  strategyCardMetricLabelClassName,
  strategyCardMetricValueClassName
} from "./styles";
import { StrategyTagBadge } from "./tag-badge";
import {
  StrategyTeamFlagsStack,
  type StrategyCardTeamRef
} from "./team-flags-stack";
import type { StrategyCardVariant, StrategyTagBadgeVariant } from "./types";

export type StrategyCardBodyProps = {
  children: ReactNode;
  className?: string;
};

export function StrategyCardBody({
  children,
  className
}: StrategyCardBodyProps) {
  return (
    <div className={cn("border border-[#EBEBEB] bg-white", className)}>
      {children}
    </div>
  );
}

export type StrategyCardMetricTone = "default" | "positive";

export type StrategyCardBodyTopProps = {
  description: string;
  badge?: StrategyTagBadgeVariant;
  budgetLabel: string;
  estimatedRoiLabel: string;
  hitReturnLabel: string;
  /** When true, Est. ROI and Hit Return show loading placeholders until live data arrives. */
  isLoading?: boolean;
  teams: StrategyCardTeamRef[];
  /** When `winner` or `loss`, shows ended-strategy outcome UI instead of Place Bid. */
  variant?: StrategyCardVariant;
  /** Actual tournament winner; shown below the hit label on `loss` cards. */
  winnerTeam?: StrategyCardTeamRef;
  onPlaceBid?: () => void;
  expanded?: boolean;
  onExpandToggle?: () => void;
  placeBidDisabled?: boolean;
  expandDisabled?: boolean;
  placeBidLabel?: string;
  className?: string;
};

export function StrategyCardBodyTop({
  description,
  badge,
  budgetLabel,
  estimatedRoiLabel,
  hitReturnLabel,
  isLoading = false,
  teams,
  variant = "available",
  winnerTeam,
  onPlaceBid,
  expanded = false,
  onExpandToggle,
  placeBidDisabled = false,
  expandDisabled = false,
  placeBidLabel,
  className
}: StrategyCardBodyTopProps) {
  const t = useTranslations("strategy");
  const resolvedPlaceBidLabel = placeBidLabel ?? t("placeBid");
  const showExpandControl = Boolean(onExpandToggle);
  const showEndedOutcome = variant === "winner" || variant === "loss";
  return (
    <div
      className={cn(
        "flex min-h-[108px] flex-col gap-4 px-4 py-4 md:gap-5 md:px-5 md:py-5",
        className
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <p className={strategyCardDescriptionClassName}>{description}</p>
        {badge ? (
          <StrategyTagBadge
            variant={badge}
            className="self-start sm:shrink-0"
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-6 gap-y-4 sm:flex sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-10 md:gap-x-12">
          <StrategyCardMetricColumn
            label={t("budget")}
            tone="default"
            muted={showEndedOutcome}
          >
            {budgetLabel}
          </StrategyCardMetricColumn>
          <StrategyCardMetricColumn
            label={t("estRoi")}
            tone="positive"
            muted={showEndedOutcome}
          >
            {isLoading ? (
              <MarketListMetricLoading
                variant="probability"
                className="h-[33px] w-16"
              />
            ) : (
              estimatedRoiLabel
            )}
          </StrategyCardMetricColumn>
          <StrategyCardMetricColumn
            label={t("hitReturn")}
            tone="positive"
            muted={showEndedOutcome}
          >
            {isLoading ? (
              <MarketListMetricLoading
                variant="volume"
                className="h-[33px] w-20"
              />
            ) : (
              hitReturnLabel
            )}
          </StrategyCardMetricColumn>
          <StrategyCardMetricColumn
            label={t("teams")}
            tone="default"
            align="start"
            muted={showEndedOutcome}
          >
            <StrategyTeamFlagsStack
              teams={teams}
              className={showEndedOutcome ? "opacity-50" : undefined}
            />
          </StrategyCardMetricColumn>
          <div className="flex shrink-0 items-center gap-2 self-stretch sm:self-auto">
            {showEndedOutcome ? (
              <StrategyCardEndedOutcome
                variant={variant}
                winnerTeam={winnerTeam}
                className="flex-1 sm:flex-initial"
              />
            ) : (
              <button
                type="button"
                onClick={onPlaceBid}
                disabled={placeBidDisabled || !onPlaceBid}
                className={cn(
                  "inline-flex h-[46px] min-w-[144px] flex-1 items-center justify-center rounded-xl",
                  "bg-[#65AF14] px-4 font-[Sora] text-lg font-medium leading-[21px] text-white",
                  "transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
                  "sm:flex-initial"
                )}
              >
                {resolvedPlaceBidLabel}
              </button>
            )}
            {showExpandControl ? (
              <button
                type="button"
                onClick={onExpandToggle}
                disabled={expandDisabled}
                aria-expanded={expanded}
                aria-label={
                  expanded
                    ? t("collapseStrategyDetails")
                    : t("expandStrategyDetails")
                }
                className={cn(
                  "inline-flex size-[46px] shrink-0 items-center justify-center rounded-xl",
                  "border border-[#EBEBEB] bg-white text-black transition-colors",
                  "hover:bg-[#fafafa] disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                <ChevronDown
                  className={cn(
                    "size-5 shrink-0 transition-transform duration-200",
                    expanded && "rotate-180"
                  )}
                  aria-hidden
                />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

type StrategyCardMetricColumnProps = {
  label: string;
  children: ReactNode;
  tone?: StrategyCardMetricTone;
  align?: "start" | "center";
  muted?: boolean;
  className?: string;
};

const endedOutcomeFlagClassName =
  "size-5 shrink-0 rounded-[4px] border border-white object-cover shadow-[0_0_2px_rgba(0,0,0,0.2)]";

function StrategyCardEndedOutcome({
  variant,
  winnerTeam,
  className
}: {
  variant: Extract<StrategyCardVariant, "winner" | "loss">;
  winnerTeam?: StrategyCardTeamRef;
  className?: string;
}) {
  const t = useTranslations("strategy");
  const isLoss = variant === "loss";
  const hitLabel = isLoss ? t("hitMissed") : t("hitSucceed");
  const hitColorClassName = isLoss ? "text-[#FF674B]" : "text-[#65AF14]";
  const winnerName = winnerTeam?.name ?? winnerTeam?.code;

  return (
    <div
      className={cn(
        "inline-flex min-h-[48px] min-w-[133px] flex-col items-end justify-between gap-1",
        className
      )}
      aria-label={isLoss ? t("strategyMissed") : t("strategySucceeded")}
    >
      <span
        className={cn(
          "font-[Sora] text-lg font-medium capitalize leading-[23px]",
          hitColorClassName
        )}
      >
        {hitLabel}
      </span>
      {winnerName ? (
        <div className="flex items-center gap-1.5">
          <TeamFlag
            code={winnerTeam?.code}
            name={winnerTeam?.name}
            logoUrl={winnerTeam?.logoUrl}
            fallback={false}
            className={endedOutcomeFlagClassName}
          />
          <span className="font-[Sora] text-sm font-normal leading-[18px] text-[#909090]">
            {t("winnerPrefix", { name: winnerName })}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function StrategyCardMetricColumn({
  label,
  children,
  tone = "default",
  align = "center",
  muted = false,
  className
}: StrategyCardMetricColumnProps) {
  const valueColorClassName = muted
    ? "text-[#909090]"
    : tone === "positive"
      ? "text-[#65AF14]"
      : "text-black";

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col",
        align === "center"
          ? "items-center text-center"
          : "items-start text-left",
        className
      )}
    >
      <div
        className={cn(
          strategyCardMetricValueClassName,
          valueColorClassName,
          "flex min-h-[33px] items-center"
        )}
      >
        {children}
      </div>
      <span className={strategyCardMetricLabelClassName}>{label}</span>
    </div>
  );
}
