import { cn } from "@/lib/cn";

import { MostAffectedTeamTable } from "./most-affected-team-table";
import { mostAffectedTeamData } from "./mock-data";
import type { MostAffectedTeamData } from "./types";

export type MostAffectedTeamProps = {
  data?: MostAffectedTeamData;
  className?: string;
};

export function MostAffectedTeam({
  data = mostAffectedTeamData,
  className
}: MostAffectedTeamProps) {
  return (
    <section
      aria-label="Most affected team"
      className={cn(
        "box-border flex h-[564px] w-full max-w-[696px] flex-col",
        "rounded-[12px] border border-[#EBEBEB] bg-white px-[20px] pt-[20px]",
        className
      )}
    >
      <h2 className="m-0 shrink-0 text-[20px] font-[457] leading-[24px] text-black">
        Most Affected Team
      </h2>

      <div className="mt-[26px] min-h-0 flex-1">
        <MostAffectedTeamTable entries={data.entries} />
      </div>
    </section>
  );
}

export type { MostAffectedTeamData, MostAffectedTeamEntry } from "./types";
