"use client";

import type { FinishType, PathResult } from "@/types/market";
import type { ThirdPlaceAllocationOption } from "@/data/world-cup-2026/third-place-options";
import type { WorldCup2026Group } from "@/data/world-cup-2026/groups";

import { BracketPanel } from "./bracket-panel";
import { GroupPanel } from "./group-panel";
import { SummaryPanel } from "./summary-panel";
import type { GroupPlacements, KnockoutWinners } from "./types";

export function RoadWorkbench({
  activeGroup,
  advancingThirdGroups,
  calculationError,
  finishType,
  knockoutWinners,
  onKnockoutReset,
  onKnockoutWinnersChange,
  onPlacementsChange,
  onSelectTeam,
  onTeamChange,
  onThirdGroupsChange,
  onViewModeChange,
  placements,
  result,
  teamId,
  thirdPlaceOption,
  viewMode
}: {
  activeGroup: WorldCup2026Group;
  advancingThirdGroups: string[];
  calculationError?: string;
  finishType: FinishType;
  knockoutWinners: KnockoutWinners;
  onKnockoutReset: () => void;
  onKnockoutWinnersChange: (winners: KnockoutWinners) => void;
  onPlacementsChange: (placements: GroupPlacements) => void;
  onSelectTeam: (teamId: string) => void;
  onTeamChange: (teamId: string) => void;
  onThirdGroupsChange: (groups: string[]) => void;
  onViewModeChange: (mode: "graph" | "list") => void;
  placements: GroupPlacements;
  result?: PathResult;
  teamId: string;
  thirdPlaceOption?: ThirdPlaceAllocationOption;
  viewMode: "graph" | "list";
}) {
  return (
    <section className="grid gap-[20px] xl:grid-cols-[minmax(300px,2fr)_minmax(0,2fr)_minmax(260px,1fr)]">
      <GroupPanel
        activeGroup={activeGroup}
        placements={placements}
        selectedTeamId={teamId}
        thirdGroups={advancingThirdGroups}
        onPlacementsChange={onPlacementsChange}
        onSelectTeam={onSelectTeam}
        onThirdGroupsChange={onThirdGroupsChange}
        onKnockoutReset={onKnockoutReset}
      />
      <BracketPanel
        calculationError={calculationError}
        finishType={finishType}
        knockoutWinners={knockoutWinners}
        onKnockoutWinnersChange={onKnockoutWinnersChange}
        onPlacementsChange={onPlacementsChange}
        onTeamChange={onTeamChange}
        onViewModeChange={onViewModeChange}
        placements={placements}
        result={result}
        teamId={teamId}
        thirdPlaceOption={thirdPlaceOption}
        viewMode={viewMode}
      />
      <SummaryPanel
        advancingThirdGroups={advancingThirdGroups}
        finishType={finishType}
        result={result}
        teamId={teamId}
        thirdPlaceOption={thirdPlaceOption}
      />
    </section>
  );
}
