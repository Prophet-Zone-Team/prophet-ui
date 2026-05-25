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
            "m-0 text-[16px] font-[300] leading-[19px]",
            LABEL_COLORS[variant]
          )}
        >
          {label}
        </p>
      </div>

      <div className="mt-[16px] flex items-baseline justify-between gap-3">
        <h3 className="m-0 text-[20px] font-[400] leading-[24px] text-black">
          {formatGroupLabel(groupId)}
        </h3>
        <CompetitivenessScore score={score} />
      </div>

      <p className="m-0 mt-[12px] max-w-[317px] text-[14px] font-[300] leading-[17px] text-[#909090]">
        {description}
      </p>
    </div>
  );
}
