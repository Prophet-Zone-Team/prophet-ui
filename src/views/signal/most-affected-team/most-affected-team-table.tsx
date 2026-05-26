import { cn } from "@/lib/cn";

import { MostAffectedTeamTableHeader } from "./most-affected-team-table-header";
import { MostAffectedTeamTableRow } from "./most-affected-team-table-row";
import type { MostAffectedTeamEntry } from "./types";

export type MostAffectedTeamTableProps = {
  entries: MostAffectedTeamEntry[];
  className?: string;
};

export function MostAffectedTeamTable({
  entries,
  className
}: MostAffectedTeamTableProps) {
  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-[16px] leading-[19px] text-[#909090]">
        No team impact data available.
      </p>
    );
  }

  return (
    <div
      role="table"
      aria-label="Most affected teams"
      className={cn("flex w-full flex-col", className)}
    >
      <MostAffectedTeamTableHeader />
      <div className="mt-3 gap-[4px] flex flex-col">
        {entries.map((entry) => (
          <MostAffectedTeamTableRow key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}
