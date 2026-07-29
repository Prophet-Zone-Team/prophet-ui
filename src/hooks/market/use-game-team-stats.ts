"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { ANALYTICS_QUERY_STALE_TIME_MS } from "@/lib/analytics/config";
import {
  findTeamStatsByPolymarketTeamId,
  mapTeamRecentFixtures
} from "@/lib/analytics/map-team-recent-fixtures";
import { mapTeamStatsStrength } from "@/lib/analytics/map-team-strength";
import { analyticsQueryKeys } from "@/lib/analytics/query-keys";
import { findTeamLineupByApiTeamId } from "@/lib/team/map-team-lineup";
import { getProphetTeamStats } from "@/service/prophet";
import type { RecentFixtureRow } from "@/views/trade/game/stats/recent-matches/types";
import type { TeamStrengthData } from "@/views/trade/game/stats/team-strength/types";

function buildPolymarketTeamIdsKey(ids: number[]): string {
  return ids.join(",");
}

export function useGameTeamStats(params: {
  homePolymarketTeamId?: number;
  awayPolymarketTeamId?: number;
  homeApiTeamId?: number;
  awayApiTeamId?: number;
}) {
  const polymarketTeamIds = useMemo(() => {
    const ids: number[] = [];

    if (
      typeof params.homePolymarketTeamId === "number" &&
      Number.isFinite(params.homePolymarketTeamId)
    ) {
      ids.push(params.homePolymarketTeamId);
    }

    if (
      typeof params.awayPolymarketTeamId === "number" &&
      Number.isFinite(params.awayPolymarketTeamId)
    ) {
      ids.push(params.awayPolymarketTeamId);
    }

    return ids;
  }, [params.awayPolymarketTeamId, params.homePolymarketTeamId]);

  const idsKey = buildPolymarketTeamIdsKey(polymarketTeamIds);
  const enabled = polymarketTeamIds.length > 0;

  const query = useQuery({
    queryKey: analyticsQueryKeys.teamStatsByPolymarketIds(idsKey),
    queryFn: () =>
      getProphetTeamStats({ polymarket_team_ids: polymarketTeamIds }),
    enabled,
    staleTime: ANALYTICS_QUERY_STALE_TIME_MS
  });

  const homeStats = useMemo(() => {
    if (typeof params.homePolymarketTeamId !== "number") {
      return undefined;
    }

    return findTeamStatsByPolymarketTeamId(
      query.data,
      params.homePolymarketTeamId
    );
  }, [params.homePolymarketTeamId, query.data]);

  const awayStats = useMemo(() => {
    if (typeof params.awayPolymarketTeamId !== "number") {
      return undefined;
    }

    return findTeamStatsByPolymarketTeamId(
      query.data,
      params.awayPolymarketTeamId
    );
  }, [params.awayPolymarketTeamId, query.data]);

  const homeFixtures = useMemo<RecentFixtureRow[]>(() => {
    if (typeof params.homeApiTeamId !== "number") {
      return [];
    }

    return mapTeamRecentFixtures(
      params.homeApiTeamId,
      homeStats?.recent_fixtures
    );
  }, [homeStats?.recent_fixtures, params.homeApiTeamId]);

  const awayFixtures = useMemo<RecentFixtureRow[]>(() => {
    if (typeof params.awayApiTeamId !== "number") {
      return [];
    }

    return mapTeamRecentFixtures(
      params.awayApiTeamId,
      awayStats?.recent_fixtures
    );
  }, [awayStats?.recent_fixtures, params.awayApiTeamId]);

  const homeStrength = useMemo<TeamStrengthData>(
    () => mapTeamStatsStrength(homeStats?.team_strength),
    [homeStats?.team_strength]
  );

  const awayStrength = useMemo<TeamStrengthData>(
    () => mapTeamStatsStrength(awayStats?.team_strength),
    [awayStats?.team_strength]
  );

  const homeLineup = useMemo(() => {
    if (typeof params.homeApiTeamId !== "number") {
      return undefined;
    }

    return findTeamLineupByApiTeamId(query.data, params.homeApiTeamId);
  }, [params.homeApiTeamId, query.data]);

  const awayLineup = useMemo(() => {
    if (typeof params.awayApiTeamId !== "number") {
      return undefined;
    }

    return findTeamLineupByApiTeamId(query.data, params.awayApiTeamId);
  }, [params.awayApiTeamId, query.data]);

  const isLoading = enabled && query.isLoading;
  const hasStarters =
    (homeLineup?.starters.length ?? 0) > 0 ||
    (awayLineup?.starters.length ?? 0) > 0;
  const isError = enabled && query.isError;
  const isLineupError = enabled && !isLoading && !hasStarters && query.isError;

  return {
    homeFixtures,
    awayFixtures,
    homeStrength,
    awayStrength,
    homeLineup,
    awayLineup,
    isLoading,
    isError,
    isLineupError,
    error: query.error
  };
}
