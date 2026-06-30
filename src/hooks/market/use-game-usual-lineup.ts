"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { ANALYTICS_QUERY_STALE_TIME_MS } from "@/lib/analytics/config";
import { marketQueryKeys } from "@/lib/market/query-keys";
import { buildRelatedGamesTeamsQuery } from "@/lib/market/related-games-query";
import { findTeamLineupByName } from "@/lib/team/map-team-lineup";
import { getProphetTeamLineup } from "@/service/prophet";

const INVALID_TEAM_NAME = "TBD";

function isValidTeamName(name: string): boolean {
  return Boolean(name?.trim()) && name !== INVALID_TEAM_NAME;
}

export function useGameUsualLineup(params: {
  homeTeamName: string;
  awayTeamName: string;
}) {
  const homeEnabled = isValidTeamName(params.homeTeamName);
  const awayEnabled = isValidTeamName(params.awayTeamName);
  const teamsKey = buildRelatedGamesTeamsQuery([
    params.homeTeamName,
    params.awayTeamName
  ]);
  const enabled = teamsKey.length > 0;

  const query = useQuery({
    queryKey: marketQueryKeys.teamLineup(teamsKey),
    queryFn: () => getProphetTeamLineup({ team_name: teamsKey }),
    enabled,
    staleTime: ANALYTICS_QUERY_STALE_TIME_MS
  });

  const homeLineup = useMemo(
    () =>
      homeEnabled
        ? findTeamLineupByName(query.data, params.homeTeamName)
        : undefined,
    [homeEnabled, params.homeTeamName, query.data]
  );

  const awayLineup = useMemo(
    () =>
      awayEnabled
        ? findTeamLineupByName(query.data, params.awayTeamName)
        : undefined,
    [awayEnabled, params.awayTeamName, query.data]
  );

  const isLoading = enabled && query.isLoading;
  const hasStarters =
    (homeLineup?.starters.length ?? 0) > 0 ||
    (awayLineup?.starters.length ?? 0) > 0;
  const isError = enabled && !isLoading && !hasStarters && query.isError;

  return {
    homeLineup,
    awayLineup,
    isLoading,
    isError
  };
}
