"use client";

import {
  WORLD_CUP_2026_GROUPS,
  getWorldCupTeamByIdOrCode,
  type WorldCup2026Group
} from "@/data/world-cup-2026/groups";
import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";

import { PLACEMENT_OPTIONS, type GroupPlacements, type Placement } from "../types";

export function GroupCard({
  activeGroup,
  group,
  onPlacementChange,
  onSelectTeam,
  onToggleThirdGroup,
  placements,
  selectedTeamId,
  thirdGroupAdvances
}: {
  activeGroup: WorldCup2026Group;
  group: WorldCup2026Group;
  onPlacementChange: (placement: Placement, teamId: string) => void;
  onSelectTeam: (teamId: string) => void;
  onToggleThirdGroup: () => void;
  placements: Record<Placement, string>;
  selectedTeamId: string;
  thirdGroupAdvances: boolean;
}) {
  const teams = WORLD_CUP_2026_GROUPS[group];

  return (
    <article
      className={cn(
        "rounded-[8px] border p-[12px]",
        group === activeGroup
          ? "border-[#18110F] bg-[#F9FAFC]"
          : "border-[#EBEBEB] bg-white"
      )}
    >
      <h3 className="m-0 text-[14px] font-[400] text-black">{group} Group</h3>
      <div className="mt-[10px] flex flex-col gap-[8px]">
        {PLACEMENT_OPTIONS.map((placement) => {
          const team =
            getWorldCupTeamByIdOrCode(placements[placement.key]) ??
            teams[PLACEMENT_OPTIONS.findIndex((item) => item.key === placement.key)];

          return (
            <label
              key={placement.key}
              className={cn(
                "flex items-center gap-[8px] rounded-[6px] p-[4px]",
                team?.id === selectedTeamId && "bg-[#F3F4F6]"
              )}
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-[6px] border-0 bg-transparent p-0 text-left"
                onClick={() => {
                  if (team) {
                    onSelectTeam(team.id);
                  }
                }}
              >
                {team ? (
                  <TeamFlag
                    code={team.code}
                    name={team.name}
                    className="h-[20px] w-[20px] shrink-0 rounded-[4px] text-[20px]"
                  />
                ) : null}
                <span className="truncate text-[12px] text-black">
                  {team?.name ?? "Pending"}
                </span>
              </button>
              <select
                value={team?.id ?? ""}
                onChange={(event) =>
                  onPlacementChange(placement.key, event.target.value)
                }
                className="h-[26px] max-w-[100px] shrink-0 rounded-[4px] border border-[#EBEBEB] bg-white px-[4px] text-[11px]"
                aria-label={`${group} ${placement.label}`}
              >
                {teams.map((optionTeam) => (
                  <option key={optionTeam.id} value={optionTeam.id}>
                    {optionTeam.name}
                  </option>
                ))}
              </select>
              {placement.key === "third" ? (
                <button
                  type="button"
                  className={cn(
                    "shrink-0 rounded-[4px] border px-[6px] py-[2px] text-[10px]",
                    thirdGroupAdvances
                      ? "border-[#18110F] bg-[#18110F] text-white"
                      : "border-[#EBEBEB] bg-white text-[#909090]"
                  )}
                  onClick={onToggleThirdGroup}
                >
                  {thirdGroupAdvances ? "Adv" : "Out"}
                </button>
              ) : (
                <small className="w-[24px] shrink-0 text-[10px] text-[#909090]">
                  {placement.label}
                </small>
              )}
            </label>
          );
        })}
      </div>
    </article>
  );
}
