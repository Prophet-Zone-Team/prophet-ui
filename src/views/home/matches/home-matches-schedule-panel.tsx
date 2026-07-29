"use client";

import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";

import { resolveLocalizedTeamName } from "@/lib/i18n/localized-team-name";

import { SyncMatchLiveStore } from "@/components/match/sync-match-live-store";

import { curatedNationalTeamsList } from "@/data/teams/curated-team-list";
import { useFootballMatches } from "@/hooks/market/use-football-matches";
import {
  buildScheduleDateGroups,
  buildScheduleFilterTeams,
  buildScheduleMatchList,
  combineScheduleTeamFilterIds,
  resolveScheduleTeamSearchMatches,
  type ScheduleFilterTeam
} from "@/lib/market/schedule-match";
import { useScheduleMatchesWithLiveState } from "@/store/match-live-store";
import type {
  FreshnessMeta,
  Team,
  TeamMarketSnapshot,
  WorldCupMatch
} from "@/types/market";
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
  /** When set (e.g. UEFA `ucol`), Show Ended refetches `/v1/games` with `ended`. */
  league?: string;
  matchesMeta?: FreshnessMeta;
}

export function HomeMatchesSchedulePanel({
  matches: initialMatches,
  snapshots,
  league,
  matchesMeta
}: HomeMatchesSchedulePanelProps) {
  const t = useTranslations("home");
  const tTeamNames = useTranslations("teamNames");
  const [showEnded, setShowEnded] = useState(false);
  const [liveOnly, setLiveOnly] = useState(false);
  const [teamSearchQuery, setTeamSearchQuery] = useState("");

  const leagueDriven = Boolean(league?.trim());
  const footballMatchesQuery = useFootballMatches({
    league: league ?? "",
    ended: showEnded,
    initialMatches,
    initialMeta: matchesMeta,
    enabled: leagueDriven
  });

  const sourceMatches = leagueDriven
    ? footballMatchesQuery.matches
    : initialMatches;

  const matchesWithLive = useScheduleMatchesWithLiveState(sourceMatches);

  const scheduleFilterTeams = useMemo(
    () => buildScheduleFilterTeamsWithLogos(sourceMatches, snapshots),
    [sourceMatches, snapshots]
  );

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
      skipEndedFilter: leagueDriven
    }),
    [filteredTeamIds, leagueDriven, liveOnly, showEnded]
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
      <SyncMatchLiveStore matches={sourceMatches} />
      <div className="pb-[20px]">
        <SpecialMatchDataCard matches={sourceMatches} snapshots={snapshots} />
      </div>

      <ScheduleFilterBar
        teamSearchQuery={teamSearchQuery}
        liveOnly={liveOnly}
        showEnded={showEnded}
        onTeamSearchQueryChange={setTeamSearchQuery}
        onLiveOnlyChange={setLiveOnly}
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
          {leagueDriven && footballMatchesQuery.isFetching
            ? t("mobileLoadingAria")
            : t("noFixturesMatchFilters")}
        </p>
      )}
    </section>
  );
}
