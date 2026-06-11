"use client";

import { GitBranch, Target } from "lucide-react";
import { useTranslations } from "next-intl";

import { getWorldCupTeamByIdOrCode } from "@/data/world-cup-2026/groups";
import { TeamFlag } from "@/components/teams/team-flag";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import type { FinishType, PathResult } from "@/types/market";
import type { ThirdPlaceAllocationOption } from "@/data/world-cup-2026/third-place-options";

import {
  translateFinish,
  translateRouteDifficulty,
  translateRoundLabel
} from "../lib/i18n-labels";
import { translateKnockoutMethod } from "../lib/method-keys";
import { getStrongestOpponent } from "../lib/format";
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
  const t = useTranslations("roadToFinal");
  const selectedTeam = getWorldCupTeamByIdOrCode(teamId);
  const champion = getWorldCupTeamByIdOrCode(championTeamId ?? "");
  const selectedTeamName = useLocalizedTeamName(
    selectedTeam?.code ?? "",
    selectedTeam?.name ?? t("teamFallback")
  );
  const championName = useLocalizedTeamName(
    champion?.code ?? "",
    champion?.name ?? ""
  );
  const strongestOpponent = getStrongestOpponent(result);
  const finalPotentialOpponents =
    result?.rounds
      .find((round) => round.round === "FINAL")
      ?.possibleOpponentTeams.slice(0, 2) ?? [];

  return (
    <div className="flex flex-col gap-[16px]">
      <Panel aria-labelledby="simulation-summary-title">
        <h2
          id="simulation-summary-title"
          className="m-0 text-[16px] font-[400] text-black"
        >
          {t("simulationSummary")}
        </h2>
        <div className="mt-[12px] flex items-center gap-[10px]">
          <TeamFlag
            code={selectedTeam?.code}
            name={selectedTeam?.name}
            className="h-[32px] w-[32px] shrink-0 rounded-[6px] text-[32px]"
          />
          <strong className="text-[16px] font-[400] text-black">
            {selectedTeam ? selectedTeamName : t("teamFallback")}
          </strong>
        </div>
        <dl className="mt-[12px] space-y-[10px]">
          <SummaryRow
            label={t("currentAssumption")}
            value={translateFinish(finishType, t)}
          />
          <SummaryRow
            label={t("advancingThirdGroups")}
            value={
              advancingThirdGroups.length === 8
                ? advancingThirdGroups.join(", ")
                : t("thirdGroupsSelected", {
                    count: advancingThirdGroups.length
                  })
            }
          />
          <SummaryRow
            label={t("annexeCOption")}
            value={
              thirdPlaceOption
                ? t("optionNumber", { option: thirdPlaceOption.option })
                : t("pending")
            }
          />
          <SummaryRow
            label={t("routeDifficulty")}
            value={translateRouteDifficulty(result, t)}
          />
          <SummaryRow
            label={t("strongestProjectedRival")}
            value={strongestOpponent?.teamName ?? t("pending")}
          />
          <SummaryRow
            label={t("finalPotentialOpponents")}
            value={
              finalPotentialOpponents.map((team) => team.teamName).join(" / ") ||
              t("pending")
            }
          />
          {knockoutMethod ? (
            <SummaryRow
              label={t("knockoutBasis")}
              value={translateKnockoutMethod(knockoutMethod, t)}
            />
          ) : null}
          <SummaryRow
            label={t("champion")}
            value={champion ? championName : t("notSelectedYet")}
          />
        </dl>
      </Panel>

      <Panel aria-labelledby="path-insights-title">
        <h2
          id="path-insights-title"
          className="m-0 text-[16px] font-[400] text-black"
        >
          {t("pathInsights")}
        </h2>
        <div className="mt-[12px] flex flex-col gap-[10px]">
          <InsightItem
            icon={<Target className="h-4 w-4" />}
            title={t("strongestRivalTitle", {
              name: strongestOpponent?.teamName ?? t("pending")
            })}
            detail={
              strongestOpponent
                ? t("strongestRivalDetail", {
                    name: strongestOpponent.teamName,
                    round: translateRoundLabel(
                      strongestOpponent.earliestRound,
                      t
                    )
                  })
                : t("needValidPathFirst")
            }
          />
          <InsightItem
            icon={<GitBranch className="h-4 w-4" />}
            title={t("annexeCResolved")}
            detail={
              thirdPlaceOption
                ? t("annexeCResolvedDetail", {
                    option: thirdPlaceOption.option
                  })
                : t("waitingForEightThirdGroups")
            }
          />
          <InsightItem
            icon={<Target className="h-4 w-4" />}
            title={t("keyAssumption")}
            detail={t("keyAssumptionDetail", {
              teamName: selectedTeam ? selectedTeamName : t("teamFallback"),
              seed: result?.seed ?? "-"
            })}
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
