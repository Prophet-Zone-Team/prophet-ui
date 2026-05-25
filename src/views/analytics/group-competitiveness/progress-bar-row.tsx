import { cn } from "@/lib/cn";

import { formatGroupLabel, getCompetitivenessBarWidth } from "./format";
import { CompetitivenessScore } from "./competitiveness-score";
import type { GroupCompetitivenessEntry, GroupCompetitivenessVariant } from "./types";

const BAR_COLORS: Record<GroupCompetitivenessVariant, string> = {
  death: "#FF674B",
  easiest: "#65AF14"
};

export type ProgressBarRowProps = {
  entry: GroupCompetitivenessEntry;
  variant: GroupCompetitivenessVariant;
  className?: string;
};

export function ProgressBarRow({ entry, variant, className }: ProgressBarRowProps) {
  const barWidth = getCompetitivenessBarWidth(entry.score);

  return (
    <div
      className={cn(
        "grid grid-cols-[54px_minmax(0,1fr)_47px] items-center gap-x-[12px]",
        className
      )}
      aria-label={`${formatGroupLabel(entry.groupId)}, ${entry.score} out of 100`}
    >
      <span className="text-[14px] font-[300] leading-[17px] text-[#909090]">
        {formatGroupLabel(entry.groupId)}
      </span>

      <div
        className="h-[8px] rounded-[4px]"
        style={{
          width: barWidth,
          backgroundColor: BAR_COLORS[variant]
        }}
        role="presentation"
      />

      <CompetitivenessScore score={entry.score} size="small" className="text-right" />
    </div>
  );
}
