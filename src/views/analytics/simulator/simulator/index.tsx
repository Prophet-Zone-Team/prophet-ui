"use client";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { TeamFlag } from "@/components/teams/team-flag";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { useAnalyticsTeamPathContext } from "@/hooks/analytics/use-analytics-team-path-context";
import {
  formatLocalizedBiggestOpponent,
  translateSimulatorCurrentStage
} from "@/lib/analytics/localized-simulator-labels";
import { getTeamPathContextSnapshot } from "@/lib/analytics/map-team-path-context";
import { cn } from "@/lib/cn";
import { defaultSimulatorTeamId } from "@/views/road-to-final/lib/teams";

import { getPathDifficultyColor } from "./mock-data";
import { TeamSelectModal } from "./team-select-modal";
import type { PathDifficulty } from "./types";

function translatePathDifficulty(
  difficulty: PathDifficulty,
  t: ReturnType<typeof useTranslations<"analytics">>
): string {
  if (difficulty === "Easy") {
    return t("pathDifficultyEasy");
  }

  if (difficulty === "Hard") {
    return t("pathDifficultyHard");
  }

  return t("pathDifficultyModerate");
}

function InfoRow({
  label,
  value,
  valueClassName,
  valueStyle
}: {
  label: string;
  value: string;
  valueClassName?: string;
  valueStyle?: CSSProperties;
}) {
  return (
    <div className="flex items-center justify-between gap-3 my-2">
      <span className="shrink-0 text-[14px] font-[400] leading-[17px] text-[#909090]">
        {label}
      </span>
      <span
        className={cn(
          "min-w-0 text-right text-[14px] font-[400] leading-[17px] text-black",
          valueClassName
        )}
        style={valueStyle}
      >
        {value}
      </span>
    </div>
  );
}

export function Simulator() {
  const t = useTranslations("analytics");
  const { teams, snapshotsByTeamId, isLoading, isError } =
    useAnalyticsTeamPathContext();
  const [selectedTeamId, setSelectedTeamId] = useState(defaultSimulatorTeamId);
  const [teamModalOpen, setTeamModalOpen] = useState(false);

  useEffect(() => {
    if (teams.length === 0) {
      return;
    }

    const hasSelection = teams.some((team) => team.id === selectedTeamId);

    if (!hasSelection) {
      const defaultTeam =
        teams.find((team) => team.id === defaultSimulatorTeamId) ?? teams[0];
      setSelectedTeamId(defaultTeam.id);
    }
  }, [teams, selectedTeamId]);

  const selectedTeam = useMemo(
    () => teams.find((team) => team.id === selectedTeamId) ?? teams[0],
    [teams, selectedTeamId]
  );

  const snapshot = useMemo(
    () => getTeamPathContextSnapshot(snapshotsByTeamId, selectedTeamId),
    [snapshotsByTeamId, selectedTeamId]
  );

  const pathDifficultyColor = getPathDifficultyColor(snapshot.pathDifficulty);
  const teamDisplayName = useLocalizedTeamName(
    selectedTeam?.teamCode ?? "",
    selectedTeam?.teamName ?? ""
  );
  const biggestOpponentName = useLocalizedTeamName(
    snapshot.biggestOpponentTeamCode ?? "",
    snapshot.biggestOpponentName ?? ""
  );
  const currentStageLabel = translateSimulatorCurrentStage(
    snapshot.currentStage,
    t
  );
  const biggestOpponentLabel = formatLocalizedBiggestOpponent(
    {
      name: snapshot.biggestOpponentName,
      round: snapshot.biggestOpponentRound
    },
    biggestOpponentName,
    t
  );

  if (isLoading) {
    return (
      <div className="flex h-[300px] w-[327px] shrink-0 items-center justify-center pl-[20px]">
        <span className="text-[14px] text-[#909090]">{t("loading")}</span>
      </div>
    );
  }

  if (isError || teams.length === 0 || !selectedTeam) {
    return (
      <div className="flex h-[300px] w-[327px] shrink-0 items-center justify-center pl-[20px]">
        <span className="text-[14px] text-[#909090]">
          {t("unableToLoadData")}
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-[300px] w-[327px] shrink-0 flex-col pl-[20px]">
        <button
          type="button"
          className="inline-flex w-fit items-center gap-[10px] border-0 bg-transparent p-0"
          aria-label={t("selectedTeamOpenSelector", {
            teamName: teamDisplayName
          })}
          aria-haspopup="dialog"
          onClick={() => setTeamModalOpen(true)}
        >
          <TeamFlag
            code={selectedTeam.teamCode}
            name={selectedTeam.teamName}
            logoUrl={selectedTeam.logoUrl}
            className="h-[36px] w-[36px] shrink-0 rounded-[6px] text-[36px]"
          />
          <span className="text-[18px] font-[500] leading-[21px] text-black">
            {teamDisplayName}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="11"
            height="6"
            viewBox="0 0 11 6"
            fill="none"
          >
            <path
              d="M9.7998 0.800781L5.40757 4.80078L0.799805 0.800781"
              stroke="#909090"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="mt-[24px] flex flex-col gap-[16px]">
          <InfoRow label={t("currentStage")} value={currentStageLabel} />
          <InfoRow
            label={t("pathDifficulty")}
            value={translatePathDifficulty(snapshot.pathDifficulty, t)}
            valueStyle={{ color: pathDifficultyColor }}
          />
          <InfoRow label={t("biggestOpponent")} value={biggestOpponentLabel} />
        </div>

        <Link
          href={`/road-to-final?team=${encodeURIComponent(selectedTeamId)}`}
          className="mt-auto flex h-[42px] w-full max-w-[307px] items-center justify-center gap-[6px] rounded-[8px] bg-[#18110F] no-underline"
          aria-label={t("openRoadToFinalSimulatorFor", {
            teamName: teamDisplayName
          })}
        >
          <span className="text-[14px] font-[500] leading-[17px] text-white">
            {t("openSimulator")}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="6"
            height="11"
            viewBox="0 0 6 11"
            fill="none"
            aria-hidden
          >
            <path
              d="M0.799805 0.800781L4.7998 5.19301L0.799805 9.80078"
              stroke="white"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </Link>
      </div>

      <TeamSelectModal
        open={teamModalOpen}
        onClose={() => setTeamModalOpen(false)}
        teams={teams}
        selectedTeamId={selectedTeamId}
        onSelectTeam={setSelectedTeamId}
      />
    </>
  );
}
