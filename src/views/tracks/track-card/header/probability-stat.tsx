"use client";

import { useTranslations } from "next-intl";

import { ProbabilityChangeTrend } from "@/components/market/probability-change-trend";
import { formatProbability } from "@/components/home/market-formatters";
import {
  trackCardLargeValueClassName,
  trackCardValueClassName
} from "../styles";
import { StatColumn } from "./stat-column";
import { cn } from "@/lib/cn";

export type ProbabilityStatProps = {
  probability: number;
  change24h: number;
  teamCode?: string;
  className?: string;
};

export function ProbabilityStat({
  probability,
  change24h,
  teamCode,
  className
}: ProbabilityStatProps) {
  const t = useTranslations("tracks");
  const changePercent = change24h;

  return (
    <StatColumn label={t("probability")} className={className}>
      <span className={trackCardLargeValueClassName}>
        {formatProbability(probability)}
      </span>
      {teamCode ? (
        <span className="text-[14px] font-[500] leading-[18px] text-[#3168FF]">
          {teamCode}
        </span>
      ) : changePercent !== 0 ? (
        <ProbabilityChangeTrend changePercent={changePercent} decimals={1} />
      ) : null}
    </StatColumn>
  );
}

export function VolumeStat({
  volumeLabel,
  className
}: {
  volumeLabel: string;
  className?: string;
}) {
  const t = useTranslations("tracks");

  return (
    <StatColumn label={t("volume")} className={cn(className)}>
      <span className={trackCardValueClassName}>{volumeLabel}</span>
    </StatColumn>
  );
}
