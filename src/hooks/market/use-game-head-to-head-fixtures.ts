"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { ANALYTICS_QUERY_STALE_TIME_MS } from "@/lib/analytics/config";
import { buildMatchHistoryEntries } from "@/lib/analytics/map-head-to-head-fixtures";
import { analyticsQueryKeys } from "@/lib/analytics/query-keys";
import { getProphetHeadToHead } from "@/service/prophet";

function isValidPolymarketTeamId(id: number | undefined): id is number {
  return typeof id === "number" && Number.isFinite(id);
}

function buildPolymarketTeamIdsKey(ids: number[]): string {
  return ids.join(",");
}

export function useGameHeadToHeadFixtures(params: {
  homePolymarketTeamId?: number;
  awayPolymarketTeamId?: number;
}) {
  const polymarketTeamIds = useMemo(() => {
    const ids: number[] = [];

    if (isValidPolymarketTeamId(params.homePolymarketTeamId)) {
      ids.push(params.homePolymarketTeamId);
    }

    if (isValidPolymarketTeamId(params.awayPolymarketTeamId)) {
      ids.push(params.awayPolymarketTeamId);
    }

    return ids;
  }, [params.awayPolymarketTeamId, params.homePolymarketTeamId]);

  const idsKey = buildPolymarketTeamIdsKey(polymarketTeamIds);
  const enabled = polymarketTeamIds.length === 2;

  const query = useQuery({
    queryKey: analyticsQueryKeys.headToHead(idsKey),
    queryFn: () =>
      getProphetHeadToHead({ polymarket_team_ids: polymarketTeamIds }),
    enabled,
    staleTime: ANALYTICS_QUERY_STALE_TIME_MS
  });

  const matches = useMemo(
    () => buildMatchHistoryEntries(query.data),
    [query.data]
  );

  return {
    matches,
    isLoading: enabled && query.isLoading,
    isError: enabled && query.isError,
    error: query.error
  };
}
