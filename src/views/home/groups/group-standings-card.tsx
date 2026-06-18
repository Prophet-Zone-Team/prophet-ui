import type { GroupStandings } from "@/types/group-standings";

import { GroupStandingsTable } from "./group-standings-table";
import { GroupTeamStandingCards } from "./group-team-standing-cards";

export function GroupStandingsCard({ group, rows }: GroupStandings) {
  return (
    <article className="overflow-hidden rounded-[12px] border border-[#EBEBEB] bg-white">
      <div className="hidden md:block">
        <GroupStandingsTable group={group} rows={rows} />
      </div>
      <div className="block md:hidden">
        <GroupTeamStandingCards group={group} rows={rows} />
      </div>
    </article>
  );
}
