import { cn } from "@/lib/cn";

import { RankingTableHeader } from "./ranking-table-header";
import { RankingTableRow } from "./ranking-table-row";
import type { TeamPowerRankingEntry } from "./types";

export type RankingTableProps = {
  entries: TeamPowerRankingEntry[];
  className?: string;
  rowGapClassName?: string;
};

export function RankingTable({
  entries,
  className,
  rowGapClassName = "gap-y-[10px]"
}: RankingTableProps) {
  return (
    <div
      role="table"
      aria-label="Team power ranking"
      className={cn("flex flex-col", className)}
    >
      <RankingTableHeader />
      <div className={cn("mt-[12px] flex flex-col", rowGapClassName)}>
        {entries.map((entry) => (
          <RankingTableRow key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}
