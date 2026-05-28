"use client";

import { cn } from "@/lib/cn";
import {
  getTeamPowerRankingPreview,
  teamPowerRankingEntries
} from "@/views/team-power-ranking/mock-data";

import { RankingHeader } from "./ranking-header";
import { RankingTable } from "./ranking-table";

export type TeamPowerRankingProps = {
  className?: string;
};

export function TeamPowerRanking({ className }: TeamPowerRankingProps) {
  const previewEntries = getTeamPowerRankingPreview(teamPowerRankingEntries);

  return (
    <section
      aria-label="Team power ranking"
      className={cn(
        "box-border flex h-auto min-h-0 w-full max-w-none flex-col md:h-[346px] md:max-w-[524px]",
        "rounded-[12px] border border-[#EBEBEB] bg-white",
        className
      )}
    >
      <RankingHeader />
      <div className="mt-[16px] min-h-0 flex-1 overflow-hidden px-3 pb-4 md:px-0 md:pb-0">
        <RankingTable entries={previewEntries} />
      </div>
    </section>
  );
}
