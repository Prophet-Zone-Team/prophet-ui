import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import { formatLongText } from "@/utils";

import { getCompetitivenessBarWidth } from "./format";
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
  const t = useTranslations("analytics");
  const groupLabel = t("groupLabel", { groupId: entry.groupId });
  const barWidth = getCompetitivenessBarWidth(entry.score);

  return (
    <div
      className={cn(
        "grid grid-cols-[62px_minmax(0,1fr)_44px] items-center gap-x-2 whitespace-nowrap md:grid-cols-[70px_minmax(0,1fr)_50px] md:gap-x-[12px]",
        className
      )}
      aria-label={t("groupScoreAria", {
        groupLabel,
        score: entry.score
      })}
    >
      <span
        className="text-[14px] font-[400] leading-[17px] text-[#909090] overflow-hidden"
        title={groupLabel}
      >
        {formatLongText(groupLabel, 6, 1)}
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
