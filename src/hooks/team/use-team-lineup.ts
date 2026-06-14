"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { ANALYTICS_QUERY_STALE_TIME_MS } from "@/lib/analytics/config";
import { marketQueryKeys } from "@/lib/market/query-keys";
import { mapTeamLineupResponse } from "@/lib/team/map-team-lineup";
import { getProphetTeamLineup } from "@/service/prophet";

export function useTeamLineup(teamName: string, enabled: boolean) {
  const normalizedTeamName = teamName.trim();

  const query = useQuery({
    queryKey: marketQueryKeys.teamLineup(normalizedTeamName),
    queryFn: () => getProphetTeamLineup({ team_name: normalizedTeamName }),
    enabled: enabled && normalizedTeamName.length > 0,
    staleTime: ANALYTICS_QUERY_STALE_TIME_MS
  });

  const lineup = useMemo(
    () => mapTeamLineupResponse(query.data),
    [query.data]
  );

  return {
    formation: lineup.formation,
    players: lineup.players,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
}
