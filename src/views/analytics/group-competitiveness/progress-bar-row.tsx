import { cn } from "@/lib/cn";

import { formatGroupLabel, getCompetitivenessBarWidth } from "./format";
import { CompetitivenessScore } from "./competitiveness-score";
import type { GroupCompetitivenessEntry, GroupCompetitivenessVariant } from "./types";
import { formatLongText } from "@/utils";

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
        "grid grid-cols-[70px_minmax(0,1fr)_50px] items-center gap-x-[12px] whitespace-nowrap",
        className
      )}
      aria-label={`${formatGroupLabel(entry.groupId)}, ${entry.score} out of 100`}
    >
      <span
        className="text-[14px] font-[400] leading-[17px] text-[#909090] overflow-hidden"
        title={formatGroupLabel(entry.groupId)}
      >
        {formatLongText(formatGroupLabel(entry.groupId), 6, 1)}
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
