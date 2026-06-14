"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { ANALYTICS_QUERY_STALE_TIME_MS } from "@/lib/analytics/config";
import { marketQueryKeys } from "@/lib/market/query-keys";
import { mapProphetTeamLineup } from "@/lib/team/map-team-lineup";
import { getProphetTeamLineup } from "@/service/prophet";

export function useTeamLineup(teamName: string) {
  const normalizedTeamName = teamName.trim();

  const query = useQuery({
    queryKey: marketQueryKeys.teamLineup(normalizedTeamName),
    queryFn: () => getProphetTeamLineup({ team_name: normalizedTeamName }),
    enabled: normalizedTeamName.length > 0,
    staleTime: ANALYTICS_QUERY_STALE_TIME_MS
  });

  const lineup = useMemo(
    () => mapProphetTeamLineup(query.data),
    [query.data]
  );

  return {
    lineup,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
}
