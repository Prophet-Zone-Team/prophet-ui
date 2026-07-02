import type { GroupStandings } from "@/types/group-standings";

import { homePanelClass } from "@/views/home/home-ui";

import { GroupStandingsTable } from "./group-standings-table";
import { GroupTeamStandingCards } from "./group-team-standing-cards";

export function GroupStandingsCard({ group, rows }: GroupStandings) {
  return (
    <article className={homePanelClass}>
      <div className="hidden md:block">
        <GroupStandingsTable group={group} rows={rows} />
      </div>
      <div className="block md:hidden">
        <GroupTeamStandingCards group={group} rows={rows} />
      </div>
    </article>
  );
}
