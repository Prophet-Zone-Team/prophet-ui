"use client";

import { useTranslations } from "next-intl";

import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";
import {
  formatPortfolioDateTime,
  formatPnlSubline,
  getOutcomeToneClass
} from "@/lib/portfolio/portfolio-format";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
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
  "border-b border-prophet-line px-4 py-2 font-[Sora] text-sm font-normal leading-[18px] text-prophet-muted"
);

const LEGS_TABLE_ROW_CLASS = cn(
  LEGS_TABLE_GRID,
  "px-4 py-3 font-[Sora] text-sm font-medium leading-[18px] text-prophet-foreground"
);

export type PortfolioStrategyLegsTableProps = {
  legs: PortfolioStrategyLeg[];
  className?: string;
};

export function PortfolioStrategyLegsTable({
  legs,
  className
}: PortfolioStrategyLegsTableProps) {
  const t = useTranslations("portfolio");
  const tCommon = useTranslations("common");

  if (legs.length === 0) {
    return null;
  }

  return (
    <div className={cn("bg-[#FCFCFC] dark:bg-prophet-panel", className)}>
      <div className="hidden min-w-[720px] md:block">
        <div className={LEGS_TABLE_HEAD_CLASS} role="row">
          <span role="columnheader">{t("market")}</span>
          <span role="columnheader">{t("traded")}</span>
          <span role="columnheader">{t("toWin")}</span>
          <span role="columnheader">{t("value")}</span>
          <span role="columnheader">{t("time")}</span>
        </div>

        {legs.map((leg) => (
          <PortfolioStrategyLegRow key={leg.id} leg={leg} t={t} tCommon={tCommon} />
        ))}
      </div>

      <div className={portfolioTableMobileListClass}>
        {legs.map((leg) => (
          <PortfolioStrategyLegMobileCard
            key={`${leg.id}-mobile`}
            leg={leg}
            t={t}
            tCommon={tCommon}
          />
        ))}
      </div>
    </div>
  );
}

function PortfolioStrategyLegRow({
  leg,
  t,
  tCommon
}: {
  leg: PortfolioStrategyLeg;
  t: ReturnType<typeof useTranslations<"portfolio">>;
  tCommon: ReturnType<typeof useTranslations<"common">>;
}) {
  const pnlTone = leg.cashPnl >= 0 ? "text-[#65AF14]" : "text-[#FF674B]";
  const sideLabel = leg.side === "yes" ? tCommon("yes") : tCommon("no");

  return (
    <div className={LEGS_TABLE_ROW_CLASS} role="row">
      <PortfolioStrategyMarketCell
        leg={leg}
        sideLabel={sideLabel}
        tradedAmountLabel={formatTeamDetailMoney(leg.tradedAmount)}
      />
      <span role="cell" className="tabular-nums">
        {formatTeamDetailMoney(leg.tradedAmount)}
      </span>
      <span role="cell" className="tabular-nums">
        {formatTeamDetailMoney(leg.toWinAmount)}
      </span>
      <div role="cell" className="flex flex-col gap-0.5">
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
  leg,
  t,
  tCommon
}: {
  leg: PortfolioStrategyLeg;
  t: ReturnType<typeof useTranslations<"portfolio">>;
  tCommon: ReturnType<typeof useTranslations<"common">>;
}) {
  const pnlTone = leg.cashPnl >= 0 ? "text-[#65AF14]" : "text-[#FF674B]";
  const sideLabel = leg.side === "yes" ? tCommon("yes") : tCommon("no");

  return (
    <article className={portfolioTableMobileCardClass}>
      <PortfolioStrategyMarketCell
        leg={leg}
        sideLabel={sideLabel}
        tradedAmountLabel={formatTeamDetailMoney(leg.tradedAmount)}
      />
      <div className="grid grid-cols-2 gap-2">
        <PortfolioTableMobileField label={t("traded")}>
          {formatTeamDetailMoney(leg.tradedAmount)}
        </PortfolioTableMobileField>
        <PortfolioTableMobileField label={t("toWin")}>
          {formatTeamDetailMoney(leg.toWinAmount)}
        </PortfolioTableMobileField>
        <PortfolioTableMobileField label={t("value")}>
          <div className="flex flex-col items-end gap-0.5">
            <span>{formatTeamDetailMoney(leg.currentValue)}</span>
            <span className={cn("text-xs font-normal", pnlTone)}>
              {formatPnlSubline(leg.cashPnl, leg.percentPnl)}
            </span>
          </div>
        </PortfolioTableMobileField>
        <PortfolioTableMobileField
          label={t("time")}
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
  return (
    <span
      role="cell"
      className={cn(
        "font-normal tabular-nums text-prophet-muted",
        align === "end" && "block text-right"
      )}
    >
      {formatPortfolioDateTime(leg.tradedAt)}
    </span>
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
        <p className="m-0 truncate font-medium text-prophet-foreground">{leg.marketTitle}</p>
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
