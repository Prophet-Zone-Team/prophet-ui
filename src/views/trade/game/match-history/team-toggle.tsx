"use client";

import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";

import type { MatchHistoryTeamOption } from "./types";

export type MatchHistoryTeamToggleProps = {
  teams: MatchHistoryTeamOption[];
  value: string;
  onChange: (teamId: string) => void;
  className?: string;
};

export function MatchHistoryTeamToggle({
  teams,
  value,
  onChange,
  className
}: MatchHistoryTeamToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Select team match history"
      className={cn(
        "flex h-[36px] w-[140px] items-center rounded-[8px] bg-[#EBEBEB] p-[4px]",
        className
      )}
    >
      {teams.map((team) => {
        const isActive = team.id === value;

        return (
          <button
            key={team.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(team.id)}
            className={cn(
              "flex h-[28px] min-w-0 flex-1 items-center justify-center gap-[4px] rounded-[6px] border-0 bg-transparent px-[6px]",
              isActive && "border border-[#EBEBEB] bg-white"
            )}
          >
            <TeamFlag
              code={team.flagCode}
              name={team.name}
              className="h-[16px] w-[16px] shrink-0 rounded-[2px] text-[16px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
            />
            <span className="text-[12px] font-[400] leading-[17px] text-black">
              {team.code}
            </span>
          </button>
        );
      })}
    </div>
  );
}
