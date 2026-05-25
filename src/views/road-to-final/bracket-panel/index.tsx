"use client";

import type { ReactNode } from "react";
import { GitBranch, List } from "lucide-react";

import {
  WORLD_CUP_2026_GROUPS,
  WORLD_CUP_2026_GROUP_ORDER,
  getWorldCupGroupForTeam
} from "@/data/world-cup-2026/groups";
import { cn } from "@/lib/cn";
import type { FinishType, PathResult } from "@/types/market";
import type { ThirdPlaceAllocationOption } from "@/data/world-cup-2026/third-place-options";

import { PLACEMENT_OPTIONS } from "../types";
import type { GroupPlacements, KnockoutWinners } from "../types";
import { updateGroupPlacement } from "../lib/placements";
import { RoadBracketGraph } from "../bracket-graph";
import { Panel } from "../ui/panel";
import { PathList } from "./path-list";

export function BracketPanel({
  calculationError,
  finishType,
  knockoutWinners,
  onKnockoutWinnersChange,
  onPlacementsChange,
  onTeamChange,
  onViewModeChange,
  placements,
  result,
  teamId,
  thirdPlaceOption,
  viewMode
}: {
  calculationError?: string;
  finishType: FinishType;
  knockoutWinners: KnockoutWinners;
  onKnockoutWinnersChange: (winners: KnockoutWinners) => void;
  onPlacementsChange: (placements: GroupPlacements) => void;
  onTeamChange: (teamId: string) => void;
  onViewModeChange: (mode: "graph" | "list") => void;
  placements: GroupPlacements;
  result?: PathResult;
  teamId: string;
  thirdPlaceOption?: ThirdPlaceAllocationOption;
  viewMode: "graph" | "list";
}) {
  return (
    <Panel className="flex min-w-0 flex-col" aria-labelledby="road-bracket-title">
      <div>
        <span className="text-[12px] font-[300] uppercase tracking-wide text-[#909090]">
          Road to Final
        </span>
        <h2
          id="road-bracket-title"
          className="m-0 mt-[4px] text-[18px] font-[400] text-black"
        >
          Knockout Path
        </h2>
      </div>

      <div className="mt-[16px] flex flex-wrap items-end justify-between gap-[12px]">
        <div className="flex flex-wrap gap-[12px]">
          <label className="flex flex-col gap-[4px]">
            <span className="text-[12px] font-[300] text-[#909090]">Team</span>
            <select
              value={teamId}
              onChange={(event) => onTeamChange(event.target.value)}
              className="h-[32px] min-w-[140px] rounded-[6px] border border-[#EBEBEB] bg-white px-[8px] text-[13px]"
            >
              {WORLD_CUP_2026_GROUP_ORDER.flatMap((group) =>
                WORLD_CUP_2026_GROUPS[group].map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))
              )}
            </select>
          </label>
          <label className="flex flex-col gap-[4px]">
            <span className="text-[12px] font-[300] text-[#909090]">
              Assumption
            </span>
            <select
              value={finishType}
              onChange={(event) => {
                const nextFinish = event.target.value as FinishType;
                const group = getWorldCupGroupForTeam(teamId);
                const placement = PLACEMENT_OPTIONS.find(
                  (item) => item.finishType === nextFinish
                )?.key;

                if (group && placement) {
                  onPlacementsChange(
                    updateGroupPlacement(
                      placements,
                      group,
                      placement,
                      teamId
                    )
                  );
                  onKnockoutWinnersChange({});
                }
              }}
              className="h-[32px] min-w-[140px] rounded-[6px] border border-[#EBEBEB] bg-white px-[8px] text-[13px]"
            >
              <option value="GROUP_WINNER">Group winner</option>
              <option value="RUNNER_UP">Runner-up</option>
              <option value="BEST_THIRD">Best third</option>
            </select>
          </label>
        </div>
        <div className="flex gap-[6px]">
          <ViewModeButton
            active={viewMode === "graph"}
            icon={<GitBranch className="h-3.5 w-3.5" />}
            label="Bracket"
            onClick={() => onViewModeChange("graph")}
          />
          <ViewModeButton
            active={viewMode === "list"}
            icon={<List className="h-3.5 w-3.5" />}
            label="List"
            onClick={() => onViewModeChange("list")}
          />
        </div>
      </div>

      {calculationError ? (
        <div className="mt-[16px] rounded-[8px] border border-[#FECACA] bg-[#FEF2F2] p-[12px]">
          <strong className="block text-[14px] text-[#991B1B]">
            {calculationError}
          </strong>
          <span className="mt-[4px] block text-[13px] font-[300] text-[#B91C1C]">
            Choose exactly eight third-place groups by assigning eight teams to
            3rd and keeping four teams outside the top three.
          </span>
        </div>
      ) : null}

      {result ? (
        <div className="mt-[16px] min-w-0">
          {viewMode === "graph" ? (
            <RoadBracketGraph
              knockoutWinners={knockoutWinners}
              onWinnerChange={onKnockoutWinnersChange}
              placements={placements}
              result={result}
              thirdPlaceOption={thirdPlaceOption}
            />
          ) : (
            <PathList result={result} />
          )}
        </div>
      ) : null}
    </Panel>
  );
}

function ViewModeButton({
  active,
  icon,
  label,
  onClick
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-[4px] rounded-[6px] border px-[10px] py-[6px] text-[12px]",
        active
          ? "border-[#18110F] bg-[#18110F] text-white"
          : "border-[#EBEBEB] bg-white text-black"
      )}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}
