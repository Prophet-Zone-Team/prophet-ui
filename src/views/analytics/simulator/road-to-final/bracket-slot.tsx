import type { CSSProperties } from "react";

import { TeamInfo } from "@/views/analytics/team-power-ranking/team-info";
import { cn } from "@/lib/cn";

import { BRACKET_SLOT_WIDTH } from "./bracket-layout";
import type { RoadToFinalSlot } from "./types";

export type BracketSlotProps = {
  team: RoadToFinalSlot;
  className?: string;
  style?: CSSProperties;
};

export function BracketSlot({ team, className, style }: BracketSlotProps) {
  return (
    <div
      className={cn(
        "flex h-[30px] shrink-0 items-center rounded-[6px] bg-[#EDEDED] px-[6px]",
        className
      )}
      style={{ width: BRACKET_SLOT_WIDTH, ...style }}
      aria-hidden={team ? undefined : true}
    >
      {team ? (
        <TeamInfo
          teamCode={team.teamCode}
          teamName={team.teamName}
          className="min-w-0"
        />
      ) : null}
    </div>
  );
}
