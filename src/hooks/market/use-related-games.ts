"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { ANALYTICS_QUERY_STALE_TIME_MS } from "@/lib/analytics/config";
import { mapProphetGamesToMatches } from "@/lib/market/prophet-game-mapper";
import { buildRelatedGamesTeamsQuery } from "@/lib/market/related-games-query";
import { marketQueryKeys } from "@/lib/market/query-keys";
import { getProphetRelatedGames } from "@/service/prophet";

const DEFAULT_LIMIT = 8;

export function useRelatedGames(params: {
  teamNames: string[];
  excludeMatchId?: string;
  limit?: number;
}) {
  const teamsKey = buildRelatedGamesTeamsQuery(params.teamNames);
  const limit = params.limit ?? DEFAULT_LIMIT;

  const query = useQuery({
    queryKey: marketQueryKeys.relatedGames(teamsKey),
    queryFn: () => getProphetRelatedGames({ teams: teamsKey }),
    enabled: teamsKey.length > 0,
    staleTime: ANALYTICS_QUERY_STALE_TIME_MS
  });

  const matches = useMemo(() => {
    const mapped = mapProphetGamesToMatches(query.data ?? []);

    const filtered = params.excludeMatchId
      ? mapped.filter((match) => match.id !== params.excludeMatchId)
      : mapped;

    return filtered.slice(0, limit);
  }, [limit, params.excludeMatchId, query.data]);

  return {
    matches,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error
  };
}
