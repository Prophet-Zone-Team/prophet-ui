"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import type { WorldCup2026Group } from "@/data/world-cup-2026/groups";
import { ANALYTICS_QUERY_STALE_TIME_MS } from "@/lib/analytics/config";
import {
  fetchGroupWinnerGammaEvent,
  mapGroupWinnerEventToHeader,
  mapGroupWinnerEventToSnapshots,
  type GroupWinnerHeaderData,
} from "@/lib/market/map-group-winner-event";
import { fetchPolymarket } from "@/lib/market/polymarket-api-client";
import { marketQueryKeys } from "@/lib/market/query-keys";
import type { TeamMarketSnapshot } from "@/types/market";

const GROUP_WINNER_POLL_MS = 5000;

export function useGroupWinnerMarket(params: {
  group: WorldCup2026Group;
  initialSnapshots: TeamMarketSnapshot[];
  initialHeader: GroupWinnerHeaderData;
}) {
  const { group, initialSnapshots, initialHeader } = params;

  const query = useQuery({
    queryKey: marketQueryKeys.groupWinner(group),
    queryFn: async () => {
      const event = await fetchGroupWinnerGammaEvent(group, (path, params) =>
        fetchPolymarket(path, params),
      );

      if (!event) {
        throw new Error("Unable to parse group winner event.");
      }

      return {
        snapshots: mapGroupWinnerEventToSnapshots(event, group),
        header: mapGroupWinnerEventToHeader(event, group),
      };
    },
    initialData: {
      snapshots: initialSnapshots,
      header: initialHeader,
    },
    initialDataUpdatedAt: 0,
    staleTime: ANALYTICS_QUERY_STALE_TIME_MS,
    refetchInterval: GROUP_WINNER_POLL_MS,
    refetchOnMount: "always",
  });

  const snapshots = useMemo(
    () => query.data?.snapshots ?? initialSnapshots,
    [initialSnapshots, query.data?.snapshots],
  );

  const header = query.data?.header ?? initialHeader;

  return {
    snapshots,
    header,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}
