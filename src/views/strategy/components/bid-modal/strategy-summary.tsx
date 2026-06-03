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
  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <h3 className="m-0 text-center font-[Sora] text-lg font-semibold capitalize leading-[23px] text-black">
        {name}
      </h3>

      <div className="flex items-end justify-between gap-6 px-1">
        <div className="flex flex-col items-center text-center">
          <span
            className={cn(
              strategyCardMetricValueClassName,
              "text-[#65AF14]"
            )}
          >
            {estimatedRoiLabel}
          </span>
          <span className={strategyCardMetricLabelClassName}>Est. ROI</span>
        </div>

        <div className="flex flex-col items-center text-center">
          <StrategyTeamFlagsStack teams={teams} />
          <span className={strategyCardMetricLabelClassName}>Teams</span>
        </div>
      </div>
    </div>
  );
}
