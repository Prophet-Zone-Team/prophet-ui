"use client";

import { GitBranch, Target } from "lucide-react";

import { getWorldCupTeamByIdOrCode } from "@/data/world-cup-2026/groups";
import { TeamFlag } from "@/components/teams/team-flag";
import type { FinishType, PathResult } from "@/types/market";
import type { ThirdPlaceAllocationOption } from "@/data/world-cup-2026/third-place-options";

import {
  formatFinish,
  getRouteDifficulty,
  getStrongestOpponent,
  ROUND_LABELS
} from "../lib/format";
import { Panel } from "../ui/panel";
import { InsightItem } from "./insight-item";

export function SummaryPanel({
  advancingThirdGroups,
  championTeamId,
  finishType,
  knockoutMethod,
  result,
  teamId,
  thirdPlaceOption
}: {
  advancingThirdGroups: string[];
  championTeamId?: string;
  finishType: FinishType;
  knockoutMethod?: string;
  result?: PathResult;
  teamId: string;
  thirdPlaceOption?: ThirdPlaceAllocationOption;
}) {
  const selectedTeam = getWorldCupTeamByIdOrCode(teamId);
  const champion = getWorldCupTeamByIdOrCode(championTeamId ?? "");
  const strongestOpponent = getStrongestOpponent(result);
  const finalPotentialOpponents =
    result?.rounds.find((round) => round.round === "FINAL")?.possibleOpponentTeams.slice(0, 2) ?? [];

  return (
    <div className="flex flex-col gap-[16px]">
      <Panel aria-labelledby="simulation-summary-title">
        <h2
          id="simulation-summary-title"
          className="m-0 text-[16px] font-[400] text-black"
        >
          Simulation Summary
        </h2>
        <div className="mt-[12px] flex items-center gap-[10px]">
          <TeamFlag
            code={selectedTeam?.code}
            name={selectedTeam?.name}
            className="h-[32px] w-[32px] shrink-0 rounded-[6px] text-[32px]"
          />
          <strong className="text-[16px] font-[400] text-black">
            {selectedTeam?.name ?? "Team"}
          </strong>
        </div>
        <dl className="mt-[12px] space-y-[10px]">
          <SummaryRow label="Current assumption" value={formatFinish(finishType)} />
          <SummaryRow
            label="Advancing 3rd groups"
            value={
              advancingThirdGroups.length === 8
                ? advancingThirdGroups.join(", ")
                : `${advancingThirdGroups.length}/8 selected`
            }
          />
          <SummaryRow
            label="Annexe C option"
            value={
              thirdPlaceOption ? `Option ${thirdPlaceOption.option}` : "Pending"
            }
          />
          <SummaryRow
            label="Route difficulty"
            value={getRouteDifficulty(result)}
          />
          <SummaryRow
            label="Strongest projected rival"
            value={strongestOpponent?.teamName ?? "Pending"}
          />
          <SummaryRow
            label="Final potential opponents"
            value={
              finalPotentialOpponents.map((team) => team.teamName).join(" / ") ||
              "Pending"
            }
          />
          {knockoutMethod ? (
            <SummaryRow label="Knockout basis" value={knockoutMethod} />
          ) : null}
          <SummaryRow
            label="Champion"
            value={champion?.name ?? "Not selected yet"}
          />
        </dl>
      </Panel>

      <Panel aria-labelledby="path-insights-title">
        <h2
          id="path-insights-title"
          className="m-0 text-[16px] font-[400] text-black"
        >
          Path Insights
        </h2>
        <div className="mt-[12px] flex flex-col gap-[10px]">
          <InsightItem
            icon={<Target className="h-4 w-4" />}
            title={`Strongest rival: ${strongestOpponent?.teamName ?? "Pending"}`}
            detail={
              strongestOpponent
                ? `${strongestOpponent.teamName} can appear from ${ROUND_LABELS[strongestOpponent.earliestRound]}.`
                : "Need a valid path first."
            }
          />
          <InsightItem
            icon={<GitBranch className="h-4 w-4" />}
            title="Annexe C resolved"
            detail={
              thirdPlaceOption
                ? `Eight third-place groups match FIFA option ${thirdPlaceOption.option}.`
                : "Waiting for exactly eight third-place groups."
            }
          />
          <InsightItem
            icon={<Target className="h-4 w-4" />}
            title="Key assumption"
            detail={`${selectedTeam?.name ?? "Team"} currently follows seed ${result?.seed ?? "-"}. Changing group rank updates the full route.`}
          />
        </div>
      </Panel>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-[12px]">
      <dt className="shrink-0 text-[13px] font-[300] text-[#909090]">{label}</dt>
      <dd className="m-0 text-right text-[13px] font-[400] text-black">
        {value}
      </dd>
    </div>
  );
}
