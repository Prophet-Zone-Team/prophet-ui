import { cn } from "@/lib/cn";

import { FullRankingTableHeader } from "./full-ranking-table-header";
import { FullRankingTableRow } from "./full-ranking-table-row";
import {
  getAdvanceOddsMax,
  getTitleOddsMax
} from "./mock-data";
import type { TeamPowerRankingEntry } from "./types";

export type FullRankingTableProps = {
  entries: TeamPowerRankingEntry[];
  className?: string;
};

export function FullRankingTable({ entries, className }: FullRankingTableProps) {
  const titleOddsMax = getTitleOddsMax(entries);
  const advanceOddsMax = getAdvanceOddsMax(entries);

  if (entries.length === 0) {
    return (
      <p className="px-5 py-8 text-center text-[16px] leading-[19px] text-[#909090]">
        No teams match these filters.
      </p>
    );
  }

  return (
    <div
      role="table"
      aria-label="Team power ranking"
      className={cn("flex w-full flex-col", className)}
    >
      <FullRankingTableHeader />
      <div className="mt-3 flex flex-col">
        {entries.map((entry) => (
          <FullRankingTableRow
            key={entry.id}
            entry={entry}
            titleOddsMax={titleOddsMax}
            advanceOddsMax={advanceOddsMax}
          />
        ))}
      </div>
    </div>
  );
}
