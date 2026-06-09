"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { ANALYTICS_QUERY_STALE_TIME_MS } from "@/lib/analytics/config";
import { marketQueryKeys } from "@/lib/market/query-keys";
import { mapTeamGameResultsToMatches } from "@/lib/team/map-team-game-results";
import { getProphetTeamGameResults } from "@/service/prophet";
import type { Team } from "@/types/market";

export function useTeamGameResults(params: {
  teamName: string;
  teamId: Team["id"];
}) {
  const teamName = params.teamName.trim();

  const query = useQuery({
    queryKey: marketQueryKeys.teamGameResults(teamName),
    queryFn: () => getProphetTeamGameResults({ team_name: teamName }),
    enabled: teamName.length > 0,
    staleTime: ANALYTICS_QUERY_STALE_TIME_MS
  });

  const matches = useMemo(
    () =>
      mapTeamGameResultsToMatches(
        query.data?.list ?? [],
        params.teamId,
        teamName
      ),
    [params.teamId, query.data?.list, teamName]
  );

  return {
    matches,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error
  };
}
