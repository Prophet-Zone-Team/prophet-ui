"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import {
  strategyCardMetricLabelClassName,
  strategyCardMetricValueClassName
} from "@/views/strategy/components/card/styles";

import { StrategyTeamFlagsStack } from "../card/team-flags-stack";
import type { StrategyCardTeamRef } from "../card/team-flags-stack";

export type StrategySummaryProps = {
  name: string;
  estimatedRoiLabel: string;
  teams: StrategyCardTeamRef[];
  className?: string;
};

export function StrategySummary({
  name,
  estimatedRoiLabel,
  teams,
  className
}: StrategySummaryProps) {
  const t = useTranslations("strategy");

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <h3 className="m-0 text-center font-[Sora] text-lg font-semibold capitalize leading-[23px] text-black">
        {name}
      </h3>

      <div className="flex items-end justify-between gap-4 px-2 sm:px-4">
        <div className="flex flex-col items-center text-center">
          <span
            className={cn(strategyCardMetricValueClassName, "text-[#65AF14]")}
          >
            {estimatedRoiLabel}
          </span>
          <span className={strategyCardMetricLabelClassName}>{t("estRoi")}</span>
        </div>

        <div className="flex flex-col items-center text-center">
          <StrategyTeamFlagsStack teams={teams} />
          <span className={strategyCardMetricLabelClassName}>{t("teams")}</span>
        </div>
      </div>
    </div>
  );
}
