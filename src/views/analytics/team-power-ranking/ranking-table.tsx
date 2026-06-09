import { cn } from "@/lib/cn";
import type { TeamPowerRankingEntry } from "@/views/team-power-ranking/types";

import { RankingTableHeader } from "./ranking-table-header";
import {
  RankingTableDesktopRow,
  RankingTableMobileCard
} from "./ranking-table-row";

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
  const tableLabel = "Team power ranking";

  return (
    <div className={cn("flex flex-col", className)}>
      <div
        role="table"
        aria-label={tableLabel}
        className="hidden w-full flex-col md:flex"
      >
        <RankingTableHeader />
        <div className={cn("mt-[12px] flex flex-col", rowGapClassName)}>
          {entries.map((entry) => (
            <RankingTableDesktopRow key={entry.id} entry={entry} />
          ))}
        </div>
      </div>

      <div
        className={cn("flex flex-col gap-2 md:hidden", rowGapClassName)}
        aria-label={tableLabel}
      >
        {entries.map((entry) => (
          <RankingTableMobileCard key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}
