"use client";

import { useState } from "react";

import { cn } from "@/lib/cn";

import { FullRankingModal } from "./full-ranking-modal";
import {
  getTeamPowerRankingPreview,
  teamPowerRankingEntries
} from "./mock-data";
import { RankingHeader } from "./ranking-header";
import { RankingTable } from "./ranking-table";

export type TeamPowerRankingProps = {
  className?: string;
};

export function TeamPowerRanking({ className }: TeamPowerRankingProps) {
  const [isFullRankingOpen, setIsFullRankingOpen] = useState(false);
  const previewEntries = getTeamPowerRankingPreview(teamPowerRankingEntries);

  return (
    <>
      <section
        aria-label="Team power ranking"
        className={cn(
          "box-border flex h-[346px] w-full max-w-[524px] flex-col",
          "rounded-[12px] border border-[#EBEBEB] bg-white",
          className
        )}
      >
        <RankingHeader onViewFullRanking={() => setIsFullRankingOpen(true)} />
        <div className="mt-[16px] min-h-0 flex-1 overflow-hidden">
          <RankingTable entries={previewEntries} />
        </div>
      </section>

      <FullRankingModal
        open={isFullRankingOpen}
        onClose={() => setIsFullRankingOpen(false)}
        entries={teamPowerRankingEntries}
      />
    </>
  );
}
