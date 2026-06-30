"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { ANALYTICS_QUERY_STALE_TIME_MS } from "@/lib/analytics/config";
import {
  findTeamStatsByName,
  mapTeamRecentFixtures
} from "@/lib/analytics/map-team-recent-fixtures";
import { mapTeamStatsStrength } from "@/lib/analytics/map-team-strength";
import { analyticsQueryKeys } from "@/lib/analytics/query-keys";
import { buildRelatedGamesTeamsQuery } from "@/lib/market/related-games-query";
import { getAnalyticsTeamsStats } from "@/service/prophet";
import type { RecentFixtureRow } from "@/views/trade/game/stats/recent-matches/types";
import type { TeamStrengthData } from "@/views/trade/game/stats/team-strength/types";

const INVALID_TEAM_NAME = "TBD";

function isValidTeamName(name: string): boolean {
  return Boolean(name?.trim()) && name !== INVALID_TEAM_NAME;
}

export function useAnalyticsTeamsStats(params: {
  homeTeamName: string;
  awayTeamName: string;
}) {
  const teamsKey = buildRelatedGamesTeamsQuery([
    params.homeTeamName,
    params.awayTeamName
  ]);
  const enabled =
    teamsKey.length > 0 &&
    isValidTeamName(params.homeTeamName) &&
    isValidTeamName(params.awayTeamName);

  const query = useQuery({
    queryKey: analyticsQueryKeys.teamsStats(teamsKey),
    queryFn: () => getAnalyticsTeamsStats({ teams: teamsKey }),
    enabled,
    staleTime: ANALYTICS_QUERY_STALE_TIME_MS
  });

  const homeFixtures = useMemo<RecentFixtureRow[]>(() => {
    const teamStats = findTeamStatsByName(query.data, params.homeTeamName);

    return mapTeamRecentFixtures(
      params.homeTeamName,
      teamStats?.recent_fixtures
    );
  }, [params.homeTeamName, query.data]);

  const awayFixtures = useMemo<RecentFixtureRow[]>(() => {
    const teamStats = findTeamStatsByName(query.data, params.awayTeamName);

    return mapTeamRecentFixtures(
      params.awayTeamName,
      teamStats?.recent_fixtures
    );
  }, [params.awayTeamName, query.data]);

  const homeStrength = useMemo<TeamStrengthData>(() => {
    const teamStats = findTeamStatsByName(query.data, params.homeTeamName);

    return mapTeamStatsStrength(teamStats?.team_strength);
  }, [params.homeTeamName, query.data]);

  const awayStrength = useMemo<TeamStrengthData>(() => {
    const teamStats = findTeamStatsByName(query.data, params.awayTeamName);

    return mapTeamStatsStrength(teamStats?.team_strength);
  }, [params.awayTeamName, query.data]);

  return {
    homeFixtures,
    awayFixtures,
    homeStrength,
    awayStrength,
    isLoading: enabled && query.isLoading,
    isError: enabled && query.isError,
    error: query.error
  };
}
