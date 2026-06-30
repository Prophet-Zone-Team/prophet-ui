"use client";

import { useTranslations } from "next-intl";

import type { WorldCup2026Group } from "@/data/world-cup-2026/groups";
import type { GroupStandingRow } from "@/types/group-standings";

import { TeamStandingCard } from "./team-standing-card";
import { getGroupLabel } from "./utils";

export function GroupTeamStandingCards({
  group,
  rows,
}: {
  group: WorldCup2026Group;
  rows: GroupStandingRow[];
}) {
  const t = useTranslations("home");
  const groupLabel = getGroupLabel(group, t);

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <h3 className="m-0 text-[18px] font-medium leading-[23px] text-prophet-foreground">
        {groupLabel}
      </h3>
      <div className="flex flex-col gap-4">
        {rows.map((row) => (
          <TeamStandingCard key={row.teamId} row={row} group={group} />
        ))}
      </div>
    </div>
  );
}
