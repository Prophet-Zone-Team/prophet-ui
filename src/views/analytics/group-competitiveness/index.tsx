import { cn } from "@/lib/cn";

import { CompetitivenessHeader } from "./competitiveness-header";
import { CompetitivenessSection } from "./competitiveness-section";
import { groupCompetitivenessData } from "./mock-data";

export type GroupCompetitivenessProps = {
  className?: string;
};

export function GroupCompetitiveness({ className }: GroupCompetitivenessProps) {
  const { deathSection, easiestSection } = groupCompetitivenessData;

  return (
    <article
      aria-label="Group competitiveness"
      className={cn(
        "box-border flex h-auto w-full max-w-none flex-col md:h-[453px] md:max-w-[696px]",
        "rounded-[12px] border border-[#EBEBEB] bg-white",
        className
      )}
    >
      <CompetitivenessHeader />

      <div className="mt-[16px] flex min-h-0 flex-1 flex-col">
        <CompetitivenessSection data={deathSection} />

        <div
          className="mx-3 border-t border-[#EBEBEB] md:mx-[25px]"
          role="separator"
          aria-hidden
        />

        <CompetitivenessSection data={easiestSection} />
      </div>
    </article>
  );
}
