import type { WorldCup2026Group } from "@/data/world-cup-2026/groups";
import type { GroupStandingRow } from "@/types/group-standings";

import { GroupBadge } from "./group-badge";
import { TeamStandingCard } from "./team-standing-card";

export function GroupTeamStandingCards({
  group,
  rows,
}: {
  group: WorldCup2026Group;
  rows: GroupStandingRow[];
}) {
  return (
    <div className="flex flex-col gap-2 px-3 pb-3 pt-3">
      <GroupBadge group={group} />
      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <TeamStandingCard key={row.teamId} row={row} />
        ))}
      </div>
    </div>
  );
}
