"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import type { WorldCup2026Group } from "@/data/world-cup-2026/groups";
import { ANALYTICS_QUERY_STALE_TIME_MS } from "@/lib/analytics/config";
import { mapProphetGamesToMatches } from "@/lib/market/prophet-game-mapper";
import { marketQueryKeys } from "@/lib/market/query-keys";
import { getProphetGroupMatches } from "@/service/prophet";

const DEFAULT_LIMIT = 12;

export function useGroupMatches(params: {
  groupCode: WorldCup2026Group;
  limit?: number;
}) {
  const { groupCode, limit = DEFAULT_LIMIT } = params;

  const query = useQuery({
    queryKey: marketQueryKeys.groupMatches(groupCode),
    queryFn: ({ signal }) =>
      getProphetGroupMatches({
        group_code: groupCode,
        signal,
      }),
    staleTime: ANALYTICS_QUERY_STALE_TIME_MS,
  });

  const matches = useMemo(() => {
    const mapped = mapProphetGamesToMatches(query.data ?? []);
    return mapped.slice(0, limit);
  }, [limit, query.data]);

  return {
    matches,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
