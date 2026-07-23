"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

import { resolveLocalizedTeamName } from "@/lib/i18n/localized-team-name";

import { SyncMatchLiveStore } from "@/components/match/sync-match-live-store";

import { curatedNationalTeamsList } from "@/data/teams/curated-team-list";
import {
  buildScheduleDateGroups,
  buildScheduleFilterTeams,
  buildScheduleMatchList,
  buildScheduleWeekOptions,
  combineScheduleTeamFilterIds,
  resolveDefaultScheduleWeek,
  resolveScheduleTeamSearchMatches,
  type ScheduleFilterTeam
} from "@/lib/market/schedule-match";
import { useScheduleMatchesWithLiveState } from "@/store/match-live-store";
import type { Team, TeamMarketSnapshot, WorldCupMatch } from "@/types/market";
import { ScheduleFilterBar } from "@/views/home/matches/schedule-filter-bar";
import { ScheduleMatchRow } from "@/views/home/matches/schedule-match-row";
import { SpecialMatchDataCard } from "@/views/home/matches/special-match-data-card";

type ScheduleFilterTeamWithLogo = ScheduleFilterTeam & { logoUrl?: string };

const FALLBACK_SCHEDULE_FILTER_TEAMS: ScheduleFilterTeamWithLogo[] =
  curatedNationalTeamsList
    .map(({ id, name, code, logoUrl }) => ({ id, name, code, logoUrl }))
    .sort((left, right) => left.name.localeCompare(right.name));

function buildScheduleFilterTeamsWithLogos(
  matches: WorldCupMatch[],
  snapshots: TeamMarketSnapshot[]
): ScheduleFilterTeamWithLogo[] {
  const teams = buildScheduleFilterTeams(matches, snapshots);

  if (teams.length === 0) {
    return FALLBACK_SCHEDULE_FILTER_TEAMS;
  }

  const logoByTeamId = new Map<Team["id"], string>();

  for (const match of matches) {
    if (match.homeTeamId && match.homeLogoUrl) {
      logoByTeamId.set(match.homeTeamId, match.homeLogoUrl);
    }
    if (match.awayTeamId && match.awayLogoUrl) {
      logoByTeamId.set(match.awayTeamId, match.awayLogoUrl);
    }
  }

  for (const snapshot of snapshots) {
    if (snapshot.team.logoUrl && !logoByTeamId.has(snapshot.team.id)) {
      logoByTeamId.set(snapshot.team.id, snapshot.team.logoUrl);
    }
  }

  return teams.map((team) => ({
    ...team,
    logoUrl: logoByTeamId.get(team.id)
  }));
}

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
  const [showEnded, setShowEnded] = useState(false);
  const [liveOnly, setLiveOnly] = useState(true);
  const [week, setWeek] = useState<number | null>(null);
  const [weekInitialized, setWeekInitialized] = useState(false);
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const matchesWithLive = useScheduleMatchesWithLiveState(matches);

  const scheduleFilterTeams = useMemo(
    () => buildScheduleFilterTeamsWithLogos(matches, snapshots),
    [matches, snapshots]
  );

  const weekOptions = useMemo(
    () => buildScheduleWeekOptions(matchesWithLive),
    [matchesWithLive]
  );

  useEffect(() => {
    if (weekInitialized || weekOptions.length === 0) {
      return;
    }

    setWeek(resolveDefaultScheduleWeek(matchesWithLive, weekOptions));
    setWeekInitialized(true);
  }, [matchesWithLive, weekInitialized, weekOptions]);

  const resolveTeamDisplayName = useCallback(
    (team: ScheduleFilterTeam) =>
      resolveLocalizedTeamName(team.code, team.name, tTeamNames),
    [tTeamNames]
  );

  const filteredTeamIds = useMemo(() => {
    const searchMatchedTeamIds = resolveScheduleTeamSearchMatches(
      scheduleFilterTeams,
      teamSearchQuery,
      resolveTeamDisplayName
    );

    return combineScheduleTeamFilterIds([], searchMatchedTeamIds);
  }, [resolveTeamDisplayName, scheduleFilterTeams, teamSearchQuery]);

  const listOptions = useMemo(
    () => ({
      showEnded,
      sortKey: "time" as const,
      teamIds: filteredTeamIds,
      liveOnly,
      week
    }),
    [filteredTeamIds, liveOnly, showEnded, week]
  );

  const sortedMatches = useMemo(
    () => buildScheduleMatchList(matchesWithLive, snapshots, listOptions),
    [listOptions, matchesWithLive, snapshots]
  );

  const dateGroups = useMemo(
    () => buildScheduleDateGroups(matchesWithLive, snapshots, listOptions),
    [listOptions, matchesWithLive, snapshots]
  );

  return (
    <section className="min-w-0" aria-label={t("footballMatchSchedule")}>
      <SyncMatchLiveStore matches={matches} />
      <div className="pb-[20px]">
        <SpecialMatchDataCard matches={matches} snapshots={snapshots} />
      </div>

      <ScheduleFilterBar
        teamSearchQuery={teamSearchQuery}
        liveOnly={liveOnly}
        week={week}
        weekOptions={weekOptions}
        showEnded={showEnded}
        onTeamSearchQueryChange={setTeamSearchQuery}
        onLiveOnlyChange={setLiveOnly}
        onWeekChange={setWeek}
        onShowEndedChange={setShowEnded}
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
                <h3 className="m-0 mb-2.5 text-[20px] font-[500] leading-[19px] text-prophet-foreground">
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
        <p className="m-0 text-sm text-prophet-muted">
          {t("noFixturesMatchFilters")}
        </p>
      )}
    </section>
  );
}
