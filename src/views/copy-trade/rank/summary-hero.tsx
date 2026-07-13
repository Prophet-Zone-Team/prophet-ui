"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";

export interface CopyTradeRankSummaryHeroProps {
  totalPnL?: number | null;
  isLoading?: boolean;
  className?: string;
}

function formatSignedUsd(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${formatTeamDetailMoney(Math.abs(value))}`;
}

function pnlToneClassName(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value === 0) {
    return "text-prophet-foreground";
  }

  return value > 0 ? "text-[#65AF14]" : "text-[#FF674B]";
}

export function CopyTradeRankSummaryHero({
  totalPnL,
  isLoading = false,
  className
}: CopyTradeRankSummaryHeroProps) {
  const t = useTranslations("copyTrade.rank");

  const displayValue =
    isLoading || totalPnL == null || !Number.isFinite(totalPnL)
      ? "—"
      : formatSignedUsd(totalPnL);

  return (
    <header
      className={cn(
        "mx-auto flex w-full max-w-[470px] flex-col items-center gap-2 px-4 text-center md:px-0",
        className
      )}
    >
      <h1 className="text-[26px] font-[600] capitalize leading-[33px] text-prophet-foreground">
        {t("heroTitle")}
      </h1>

      <div className="flex flex-col gap-1">
        <p className="text-[12px] font-[400] leading-[15px] text-prophet-foreground">
          {t("summaryTotalPnlLabel")}
        </p>
        <p
          className={cn(
            "text-[20px] font-[600] leading-[25px] tabular-nums",
            isLoading
              ? "animate-pulse text-prophet-muted"
              : pnlToneClassName(totalPnL)
          )}
          aria-live="polite"
        >
          {displayValue}
        </p>
      </div>
    </header>
  );
}
