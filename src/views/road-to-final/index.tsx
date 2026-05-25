"use client";

import { useMemo, useState } from "react";

import {
  getWorldCupGroupForTeam,
  getWorldCupTeamByIdOrCode
} from "@/data/world-cup-2026/groups";

import { resolveThirdPlaceOption } from "./bracket-graph/bracket-resolver";
import { safeCalculatePath } from "./lib/calculate-path";
import { getFinishForTeam } from "./lib/placements";
import { DEFAULT_THIRD_PLACE_GROUPS } from "./lib/path-config";
import { createDefaultPlacements } from "./lib/placements";
import { defaultSimulatorTeamId } from "./lib/teams";
import { RoadWorkbench } from "./workbench";
import type { KnockoutWinners } from "./types";

export function RoadToFinalPage({
  initialTeamId = defaultSimulatorTeamId
}: {
  initialTeamId?: string;
}) {
  const safeInitialTeamId =
    getWorldCupTeamByIdOrCode(initialTeamId)?.id ?? defaultSimulatorTeamId;
  const [placements, setPlacements] = useState(createDefaultPlacements);
  const [teamId, setTeamId] = useState(safeInitialTeamId);
  const [viewMode, setViewMode] = useState<"graph" | "list">("graph");
  const [thirdGroups, setThirdGroups] = useState<string[]>([
    ...DEFAULT_THIRD_PLACE_GROUPS
  ]);
  const [knockoutWinners, setKnockoutWinners] = useState<KnockoutWinners>({});

  const activeGroup = getWorldCupGroupForTeam(teamId) ?? "C";
  const finishType = getFinishForTeam(placements, teamId) ?? "GROUP_WINNER";
  const advancingThirdGroups = useMemo(
    () => thirdGroups.slice().sort(),
    [thirdGroups]
  );

  const calculation = useMemo(
    () =>
      safeCalculatePath({
        teamId,
        finishType,
        thirdGroups: advancingThirdGroups,
        placements
      }),
    [advancingThirdGroups, finishType, placements, teamId]
  );

  const result = calculation.result;
  const thirdPlaceOption = resolveThirdPlaceOption(advancingThirdGroups);

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 pb-8 pt-[30px]">
      <RoadWorkbench
        activeGroup={activeGroup}
        advancingThirdGroups={advancingThirdGroups}
        calculationError={calculation.error}
        finishType={finishType}
        knockoutWinners={knockoutWinners}
        onKnockoutReset={() => setKnockoutWinners({})}
        onKnockoutWinnersChange={setKnockoutWinners}
        onPlacementsChange={setPlacements}
        onSelectTeam={setTeamId}
        onTeamChange={setTeamId}
        onThirdGroupsChange={setThirdGroups}
        onViewModeChange={setViewMode}
        placements={placements}
        result={result}
        teamId={teamId}
        thirdPlaceOption={thirdPlaceOption}
        viewMode={viewMode}
      />
    </div>
  );
}
