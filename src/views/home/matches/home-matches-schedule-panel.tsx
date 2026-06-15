"use client";

import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";

import { resolveLocalizedTeamName } from "@/lib/i18n/localized-team-name";

import { SyncMatchLiveStore } from "@/components/match/sync-match-live-store";

import { curatedNationalTeamsList } from "@/data/teams/curated-team-list";
import {
  buildScheduleDateGroups,
  buildScheduleMatchList,
  combineScheduleTeamFilterIds,
  resolveScheduleTeamSearchMatches,
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
  const t = useTranslations("home");
  const tTeamNames = useTranslations("teamNames");
  const [sortKey, setSortKey] = useState<ScheduleSortKey>("time");
  const [showEnded, setShowEnded] = useState(false);
  const [selectedTeamIds, setSelectedTeamIds] = useState<Team["id"][]>([]);
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const matchesWithLive = useScheduleMatchesWithLiveState(matches);

  const resolveTeamDisplayName = useCallback(
    (team: ScheduleFilterTeam) =>
      resolveLocalizedTeamName(team.code, team.name, tTeamNames),
    [tTeamNames]
  );

  const filteredTeamIds = useMemo(() => {
    const searchMatchedTeamIds = resolveScheduleTeamSearchMatches(
      SCHEDULE_FILTER_TEAMS,
      teamSearchQuery,
      resolveTeamDisplayName
    );

    return combineScheduleTeamFilterIds(selectedTeamIds, searchMatchedTeamIds);
  }, [resolveTeamDisplayName, selectedTeamIds, teamSearchQuery]);

  const sortedMatches = useMemo(
    () =>
      buildScheduleMatchList(matchesWithLive, snapshots, {
        showEnded,
        sortKey,
        teamIds: filteredTeamIds
      }),
    [filteredTeamIds, matchesWithLive, snapshots, showEnded, sortKey]
  );

  const dateGroups = useMemo(
    () =>
      buildScheduleDateGroups(matchesWithLive, snapshots, {
        showEnded,
        sortKey,
        teamIds: filteredTeamIds
      }),
    [filteredTeamIds, matchesWithLive, snapshots, showEnded, sortKey]
  );

  return (
    <section className="min-w-0" aria-label={t("footballMatchSchedule")}>
      <SyncMatchLiveStore matches={matches} />
      <div className="pb-[20px]">
        <SpecialMatchDataCard matches={matches} snapshots={snapshots} />
      </div>

      <ScheduleFilterBar
        sortKey={sortKey}
        showEnded={showEnded}
        teams={SCHEDULE_FILTER_TEAMS}
        selectedTeamIds={selectedTeamIds}
        teamSearchQuery={teamSearchQuery}
        onSortKeyChange={setSortKey}
        onShowEndedChange={setShowEnded}
        onSelectedTeamIdsChange={setSelectedTeamIds}
        onTeamSearchQueryChange={setTeamSearchQuery}
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
          {t("noFixturesMatchFilters")}
        </p>
      )}
    </section>
  );
}
