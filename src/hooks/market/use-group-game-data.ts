"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import type { WorldCup2026Group } from "@/data/world-cup-2026/groups";
import { ANALYTICS_QUERY_STALE_TIME_MS } from "@/lib/analytics/config";
import {
  buildStandingsPointsBySnapshotTeamId,
  mapGroupGameMatches,
} from "@/lib/market/map-group-game-data";
import { marketQueryKeys } from "@/lib/market/query-keys";
import { getProphetGroup } from "@/service/prophet";
import type { TeamMarketSnapshot } from "@/types/market";

export function useGroupGameData(params: {
  group: WorldCup2026Group;
  snapshots: TeamMarketSnapshot[];
}) {
  const { group, snapshots } = params;

  const query = useQuery({
    queryKey: marketQueryKeys.groupGame(group),
    queryFn: ({ signal }) =>
      getProphetGroup({
        group_code: group,
        signal,
      }),
    staleTime: ANALYTICS_QUERY_STALE_TIME_MS,
  });

  const pointsByTeamId = useMemo(
    () =>
      buildStandingsPointsBySnapshotTeamId(
        query.data?.standings ?? [],
        snapshots,
      ),
    [query.data?.standings, snapshots],
  );

  const matches = useMemo(
    () => mapGroupGameMatches(query.data?.matches ?? []),
    [query.data?.matches],
  );

  return {
    pointsByTeamId,
    matches,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
