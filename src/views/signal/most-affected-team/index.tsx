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
        "box-border flex h-auto w-full max-w-none flex-col md:h-[564px] md:max-w-[696px]",
        "rounded-[12px] border border-[#EBEBEB] bg-white px-3 pb-4 pt-4 md:px-5 md:pb-5 md:pt-5",
        className
      )}
    >
      <h2 className="m-0 shrink-0 text-lg font-[457] leading-[22px] text-black md:text-[20px] md:leading-[24px]">
        Most Affected Team
      </h2>

      <div className="mt-4 min-h-0 flex-1 md:mt-[26px]">
        <MostAffectedTeamTable entries={data.entries} />
      </div>
    </section>
  );
}

export type { MostAffectedTeamData, MostAffectedTeamEntry } from "./types";
