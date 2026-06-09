import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { formatGroupLabel } from "./format";
import { CompetitivenessScore } from "./competitiveness-score";
import type { GroupCompetitivenessVariant } from "./types";

const LABEL_COLORS: Record<GroupCompetitivenessVariant, string> = {
  death: "text-[#FF4242]",
  easiest: "text-[#65AF14]"
};

export type SectionSummaryProps = {
  variant: GroupCompetitivenessVariant;
  label: string;
  groupId: string;
  score: number;
  description: string;
  icon: ReactNode;
  className?: string;
};

export function SectionSummary({
  variant,
  label,
  groupId,
  score,
  description,
  icon,
  className
}: SectionSummaryProps) {
  return (
    <div className={cn("flex min-w-0 flex-col", className)}>
      <div className="flex items-center gap-[8px]">
        <div className="flex shrink-0 items-center justify-center">{icon}</div>
        <p
          className={cn(
            "m-0 text-[16px] font-[400] leading-[19px]",
            LABEL_COLORS[variant]
          )}
        >
          {label}
        </p>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-3 md:mt-[16px]">
        <h3 className="m-0 text-lg font-[500] leading-[22px] text-black md:text-[20px] md:leading-[24px]">
          {formatGroupLabel(groupId)}
        </h3>
        <CompetitivenessScore score={score} />
      </div>

      <p className="m-0 mt-3 max-w-full text-[14px] font-[400] leading-[17px] text-[#909090] md:mt-[12px] md:max-w-[317px]">
        {description}
      </p>
    </div>
  );
}
