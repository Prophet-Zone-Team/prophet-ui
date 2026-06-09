"use client";

import { useMemo, useState } from "react";

import { SyncMatchLiveStore } from "@/components/match/sync-match-live-store";

import { curatedNationalTeamsList } from "@/data/teams/curated-team-list";
import {
  buildScheduleDateGroups,
  buildScheduleMatchList,
  type ScheduleFilterTeam,
  type ScheduleSortKey
} from "@/lib/market/schedule-match";
import { useScheduleMatchesWithLiveState } from "@/store/match-live-store";
import type { Team, TeamMarketSnapshot, WorldCupMatch } from "@/types/market";
import { ScheduleFilterBar } from "@/views/home/matches/schedule-filter-bar";
import { ScheduleMatchRow } from "@/views/home/matches/schedule-match-row";
import { SpecialMatchDataCard } from "@/views/home/matches/special-match-data-card";

const SCHEDULE_FILTER_TEAMS: (ScheduleFilterTeam & { logoUrl?: string })[] =
  curatedNationalTeamsList
    .map(({ id, name, code, logoUrl }) => ({ id, name, code, logoUrl }))
    .sort((left, right) => left.name.localeCompare(right.name));

export interface HomeMatchesSchedulePanelProps {
  matches: WorldCupMatch[];
  snapshots: TeamMarketSnapshot[];
}

export function HomeMatchesSchedulePanel({
  matches,
  snapshots
}: HomeMatchesSchedulePanelProps) {
  const [sortKey, setSortKey] = useState<ScheduleSortKey>("time");
  const [showEnded, setShowEnded] = useState(false);
  const [selectedTeamIds, setSelectedTeamIds] = useState<Team["id"][]>([]);
  const matchesWithLive = useScheduleMatchesWithLiveState(matches);

  const sortedMatches = useMemo(
    () =>
      buildScheduleMatchList(matchesWithLive, snapshots, {
        showEnded,
        sortKey,
        teamIds: selectedTeamIds
      }),
    [matchesWithLive, snapshots, showEnded, sortKey, selectedTeamIds]
  );

  const dateGroups = useMemo(
    () =>
      buildScheduleDateGroups(matchesWithLive, snapshots, {
        showEnded,
        sortKey,
        teamIds: selectedTeamIds
      }),
    [matchesWithLive, snapshots, showEnded, sortKey, selectedTeamIds]
  );

  return (
    <section className="min-w-0" aria-label="Football match schedule">
      <SyncMatchLiveStore matches={matches} />
      <div className="pb-[20px]">
        <SpecialMatchDataCard matches={matches} snapshots={snapshots} />
      </div>

      <ScheduleFilterBar
        sortKey={sortKey}
        showEnded={showEnded}
        teams={SCHEDULE_FILTER_TEAMS}
        selectedTeamIds={selectedTeamIds}
        onSortKeyChange={setSortKey}
        onShowEndedChange={setShowEnded}
        onSelectedTeamIdsChange={setSelectedTeamIds}
      />

      {sortedMatches.length > 0 ? (
        dateGroups ? (
          <div className="flex flex-col gap-4 px-3 md:px-0">
            {dateGroups.map((group) => (
              <section
                key={group.dateKey}
                aria-label={group.label}
                className="mt-[16px]"
              >
                <h3 className="m-0 mb-2.5 text-[20px] font-[500] leading-[19px] text-black">
                  {group.label}
                </h3>
                <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                  {group.matches.map((match) => (
                    <li key={match.id}>
                      <ScheduleMatchRow match={match} snapshots={snapshots} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {sortedMatches.map((match) => (
              <li key={match.id}>
                <ScheduleMatchRow match={match} snapshots={snapshots} />
              </li>
            ))}
          </ul>
        )
      ) : (
        <p className="m-0 text-sm text-[#909090]">
          No fixtures match the current filters.
        </p>
      )}
    </section>
  );
}
