"use client";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";

import {
  defaultSimulatorTeamId,
  getPathDifficultyColor,
  getSimulatorSnapshot,
  simulatorTeams
} from "./mock-data";
import { TeamSelectModal } from "./team-select-modal";

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
      <span className="shrink-0 text-[14px] font-[300] leading-[17px] text-[#909090]">
        {label}
      </span>
      <span
        className={cn(
          "min-w-0 text-right text-[14px] font-[300] leading-[17px] text-black",
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
  const [selectedTeamId, setSelectedTeamId] = useState(defaultSimulatorTeamId);
  const [teamModalOpen, setTeamModalOpen] = useState(false);

  const selectedTeam = useMemo(
    () =>
      simulatorTeams.find((team) => team.id === selectedTeamId) ??
      simulatorTeams[0],
    [selectedTeamId]
  );

  const snapshot = useMemo(
    () => getSimulatorSnapshot(selectedTeamId),
    [selectedTeamId]
  );

  const pathDifficultyColor = getPathDifficultyColor(snapshot.pathDifficulty);

  return (
    <>
      <div className="flex h-[300px] w-[327px] shrink-0 flex-col pl-[20px]">
        <button
          type="button"
          className="inline-flex w-fit items-center gap-[10px] border-0 bg-transparent p-0"
          aria-label={`Selected team: ${selectedTeam.teamName}. Open team selector`}
          aria-haspopup="dialog"
          onClick={() => setTeamModalOpen(true)}
        >
          <TeamFlag
            code={selectedTeam.teamCode}
            name={selectedTeam.teamName}
            className="h-[36px] w-[36px] shrink-0 rounded-[6px] text-[36px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
          />
          <span className="text-[18px] font-[400] leading-[21px] text-black">
            {selectedTeam.teamName}
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
          <InfoRow label="Current Stage" value={snapshot.currentStage} />
          <InfoRow
            label="Path Difficulty"
            value={snapshot.pathDifficulty}
            valueStyle={{ color: pathDifficultyColor }}
          />
          <InfoRow label="Biggest Opponent" value={snapshot.biggestOpponent} />
        </div>

        <Link
          href={`/road-to-final?team=${encodeURIComponent(selectedTeamId)}`}
          className="mt-auto flex h-[42px] w-full max-w-[307px] items-center justify-center gap-[6px] rounded-[8px] bg-[#18110F] no-underline"
          aria-label={`Open road to final simulator for ${selectedTeam.teamName}`}
        >
          <span className="text-[14px] font-[400] leading-[17px] text-white">
            Open Simulator
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
        teams={simulatorTeams}
        selectedTeamId={selectedTeamId}
        onSelectTeam={setSelectedTeamId}
      />
    </>
  );
}
