"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/cn";

import { MatchHistoryRow } from "./row";
import { matchHistoryTableGridClass } from "./table-grid";
import { MatchHistoryTeamToggle } from "./team-toggle";
import { tradeGameMatchHistoryTeams } from "./mock-data";
import type { MatchHistoryTeamOption } from "./types";

export type MatchHistoryProps = {
  teams?: MatchHistoryTeamOption[];
  defaultTeamId?: string;
  className?: string;
};

export function MatchHistory({
  teams = tradeGameMatchHistoryTeams,
  defaultTeamId,
  className
}: MatchHistoryProps) {
  const initialTeamId = defaultTeamId ?? teams[0]?.id ?? "";
  const [selectedTeamId, setSelectedTeamId] = useState(initialTeamId);

  const selectedTeam = useMemo(
    () => teams.find((team) => team.id === selectedTeamId) ?? teams[0],
    [selectedTeamId, teams]
  );

  const matches = selectedTeam?.matches ?? [];

  return (
    <section
      aria-label="Match history"
      className={cn(
        "w-full max-w-[531px] rounded-[12px] bg-white px-[12px] py-[16px]",
        "shadow-[0_0_10px_rgba(0,0,0,0.1)]",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 text-[18px] font-[500] leading-[21px] text-black">
          Match History
        </h2>
        {teams.length > 0 ? (
          <MatchHistoryTeamToggle
            teams={teams}
            value={selectedTeam?.id ?? initialTeamId}
            onChange={setSelectedTeamId}
          />
        ) : null}
      </div>

      <div
        role="table"
        aria-label={`${selectedTeam?.name ?? "Team"} match history`}
        className="mt-[12px] flex w-full flex-col"
      >
        <div
          role="row"
          className={cn(
            matchHistoryTableGridClass,
            "px-[12px] pb-[8px] text-[12px] font-[400] leading-[17px] text-[#909090]"
          )}
        >
          <span role="columnheader">Time</span>
          <span role="columnheader">Format</span>
          <span role="columnheader">Home</span>
          <span role="columnheader" className="text-center">
            VS
          </span>
          <span role="columnheader">Away</span>
          <span role="columnheader">Result</span>
        </div>

        <div className="flex flex-col gap-[2px]">
          {matches.length === 0 ? (
            <p className="py-6 text-center text-[14px] font-[457] leading-[17px] text-[#909090]">
              No match history is available for this team yet.
            </p>
          ) : (
            matches.map((entry, index) => (
              <MatchHistoryRow
                key={entry.id}
                entry={entry}
                highlighted={index % 2 === 0}
                tall={Boolean(entry.penaltyScore)}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export type {
  MatchHistoryEntry,
  MatchHistoryResultKind,
  MatchHistoryTeamOption
} from "./types";
