"use client";

import { useMemo, useState } from "react";

import { SyncMatchLiveStore } from "@/components/match/sync-match-live-store";

import {
  buildScheduleDateGroups,
  buildScheduleFilterTeams,
  buildScheduleMatchList,
  findFeaturedScheduleMatch,
  type ScheduleSortKey
} from "@/lib/market/schedule-match";
import type { Team, TeamMarketSnapshot, WorldCupMatch } from "@/types/market";
import { ScheduleFilterBar } from "@/views/home/matches/schedule-filter-bar";
import { ScheduleMatchRow } from "@/views/home/matches/schedule-match-row";
import { SpecialMatchDataCard } from "@/views/home/matches/special-match-data-card";

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

  const filterTeams = useMemo(
    () => buildScheduleFilterTeams(matches, snapshots),
    [matches, snapshots]
  );

  const sortedMatches = useMemo(
    () =>
      buildScheduleMatchList(matches, snapshots, {
        showEnded,
        sortKey,
        teamIds: selectedTeamIds
      }),
    [matches, snapshots, showEnded, sortKey, selectedTeamIds]
  );

  const dateGroups = useMemo(
    () =>
      buildScheduleDateGroups(matches, snapshots, {
        showEnded,
        sortKey,
        teamIds: selectedTeamIds
      }),
    [matches, snapshots, showEnded, sortKey, selectedTeamIds]
  );

  const featuredMatch = useMemo(
    () => findFeaturedScheduleMatch(matches),
    [matches]
  );

  return (
    <section className="min-w-0" aria-label="Football match schedule">
      <SyncMatchLiveStore matches={matches} />
      {featuredMatch ? (
        <div className="pb-[20px]">
          <SpecialMatchDataCard match={featuredMatch} snapshots={snapshots} />
        </div>
      ) : null}

      <ScheduleFilterBar
        sortKey={sortKey}
        showEnded={showEnded}
        teams={filterTeams}
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
                <h3 className="m-0 mb-2.5 text-[20px] font-[556] leading-[19px] text-black">
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
