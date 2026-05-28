import { cn } from "@/lib/cn";

import { CompetitivenessList } from "./competitiveness-list";
import { EasiestGroupIcon, GroupOfDeathIcon } from "./icons";
import { SectionSummary } from "./section-summary";
import type { GroupCompetitivenessSectionData } from "./types";

const SECTION_ICONS = {
  death: GroupOfDeathIcon,
  easiest: EasiestGroupIcon
} as const;

export type CompetitivenessSectionProps = {
  data: GroupCompetitivenessSectionData;
  className?: string;
};

export function CompetitivenessSection({
  data,
  className
}: CompetitivenessSectionProps) {
  const featuredEntry = data.entries[0];
  const Icon = SECTION_ICONS[data.variant];

  if (!featuredEntry) {
    return null;
  }

  return (
    <section
      aria-label={data.label}
      className={cn(
        "flex flex-none flex-col items-stretch gap-4 px-3 py-4 md:flex-1 md:flex-row md:items-start md:gap-[30px] md:px-[25px] md:py-[24px]",
        className
      )}
    >
      <SectionSummary
        variant={data.variant}
        label={data.label}
        groupId={featuredEntry.groupId}
        score={featuredEntry.score}
        description={data.description}
        icon={<Icon />}
        className="w-full shrink-0 md:w-[280px]"
      />

      <CompetitivenessList
        entries={data.entries}
        variant={data.variant}
        className="min-w-0 flex-1 pt-0 md:pt-[2px]"
      />
    </section>
  );
}
