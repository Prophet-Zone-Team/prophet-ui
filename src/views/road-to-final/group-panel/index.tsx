"use client";

import { List, RotateCcw, Trash2, Wand2 } from "lucide-react";

import { WORLD_CUP_2026_GROUP_ORDER } from "@/data/world-cup-2026/groups";
import type { WorldCup2026Group } from "@/data/world-cup-2026/groups";

import { DEFAULT_THIRD_PLACE_GROUPS } from "../lib/path-config";
import {
  createDefaultPlacements,
  createSeededPlacements,
  toggleThirdGroup,
  updateGroupPlacement
} from "../lib/placements";
import type { GroupPlacements } from "../types";
import { Panel } from "../ui/panel";
import { GroupCard } from "./group-card";

export function GroupPanel({
  activeGroup,
  placements,
  selectedTeamId,
  thirdGroups,
  onPlacementsChange,
  onSelectTeam,
  onThirdGroupsChange,
  onKnockoutReset,
  hideToolbar = false
}: {
  activeGroup: WorldCup2026Group;
  placements: GroupPlacements;
  selectedTeamId: string;
  thirdGroups: string[];
  onPlacementsChange: (placements: GroupPlacements) => void;
  onSelectTeam: (teamId: string) => void;
  onThirdGroupsChange: (groups: string[]) => void;
  onKnockoutReset: () => void;
  hideToolbar?: boolean;
}) {
  const groupGrid = (
    <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2">
      {WORLD_CUP_2026_GROUP_ORDER.map((group) => (
        <GroupCard
          key={group}
          activeGroup={activeGroup}
          group={group}
          thirdGroupAdvances={thirdGroups.includes(group)}
          placements={placements[group]}
          selectedTeamId={selectedTeamId}
          onPlacementChange={(placement, nextTeamId) => {
            onPlacementsChange(
              updateGroupPlacement(placements, group, placement, nextTeamId)
            );
            onSelectTeam(nextTeamId);
            onKnockoutReset();
          }}
          onSelectTeam={onSelectTeam}
          onToggleThirdGroup={() => {
            onThirdGroupsChange(toggleThirdGroup(thirdGroups, group));
            onKnockoutReset();
          }}
        />
      ))}
    </div>
  );

  if (hideToolbar) {
    return groupGrid;
  }

  return (
    <Panel aria-labelledby="group-selector-title" className="flex flex-col">
      <div className="flex gap-[10px]">
        <span className="mt-[2px] text-[#909090]" aria-hidden>
          <List className="h-5 w-5" />
        </span>
        <div>
          <h1
            id="group-selector-title"
            className="m-0 text-[18px] font-[400] leading-[21px] text-black"
          >
            Group Ranking Selector
          </h1>
          <p className="m-0 mt-[6px] text-[14px] font-[300] leading-[17px] text-[#909090]">
            Select 1st / 2nd / 3rd placements. The path updates with FIFA Annexe
            C rules.
          </p>
        </div>
      </div>

      <div className="mt-[16px]">{groupGrid}</div>

      <div className="mt-[16px] flex flex-wrap gap-[8px]">
        <button
          type="button"
          className="inline-flex items-center gap-[6px] rounded-[8px] bg-[#18110F] px-[14px] py-[8px] text-[13px] text-white"
          onClick={() => {
            onPlacementsChange(createSeededPlacements());
            onThirdGroupsChange([...DEFAULT_THIRD_PLACE_GROUPS]);
            onKnockoutReset();
          }}
        >
          <Wand2 className="h-4 w-4" aria-hidden />
          Auto-fill assumptions
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-[6px] rounded-[8px] border border-[#EBEBEB] bg-white px-[14px] py-[8px] text-[13px] text-black"
          onClick={() => {
            onPlacementsChange(createDefaultPlacements());
            onThirdGroupsChange([...DEFAULT_THIRD_PLACE_GROUPS]);
            onKnockoutReset();
          }}
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Reset
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-[6px] rounded-[8px] border border-[#EBEBEB] bg-white px-[14px] py-[8px] text-[13px] text-black"
          onClick={() => {
            onPlacementsChange(createDefaultPlacements());
            onThirdGroupsChange([]);
            onKnockoutReset();
          }}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          Clear
        </button>
      </div>
    </Panel>
  );
}
