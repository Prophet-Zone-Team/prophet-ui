import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";

import { formatNetImpact } from "./format";
import { mostAffectedTeamTableGridClass } from "./most-affected-team-table-header";
import type { MostAffectedTeamEntry } from "./types";

export type MostAffectedTeamTableRowProps = {
  entry: MostAffectedTeamEntry;
};

export function MostAffectedTeamTableRow({
  entry
}: MostAffectedTeamTableRowProps) {
  const isNegativeImpact = entry.netImpact < 0;

  return (
    <div
      role="row"
      className={cn(
        mostAffectedTeamTableGridClass,
        "items-center py-[10px] text-[16px] font-[457] leading-[19px] text-black"
      )}
    >
      <span role="cell" className="tabular-nums">
        {entry.rank}
      </span>
      <div role="cell" className="flex min-w-0 items-center gap-[8px]">
        <TeamFlag
          code={entry.teamCode}
          name={entry.teamName}
          className="h-[20px] w-[20px] shrink-0 rounded-[4px] text-[20px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
        />
        <span>{entry.teamName}</span>
      </div>
      <span
        role="cell"
        className={cn(
          "tabular-nums",
          isNegativeImpact ? "text-[#FF674B]" : "text-black"
        )}
      >
        {formatNetImpact(entry.netImpact)}
      </span>
      <span role="cell" className="text-right tabular-nums">
        {entry.highImpactEventCount}
      </span>
    </div>
  );
}
