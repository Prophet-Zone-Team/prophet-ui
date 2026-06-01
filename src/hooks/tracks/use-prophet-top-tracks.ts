"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { mapProphetTopTracksToAttentionCards } from "@/lib/tracks/prophet-top-attention-mapper";
import {
  TOP_TRACKS_STALE_TIME_MS,
  tracksQueryKeys
} from "@/lib/tracks/query-keys";
import { getProphetTopTracks } from "@/service/prophet";

export function useProphetTopTracks() {
  const query = useQuery({
    queryKey: tracksQueryKeys.top,
    queryFn: getProphetTopTracks,
    staleTime: TOP_TRACKS_STALE_TIME_MS
  });

  const cards = useMemo(
    () => mapProphetTopTracksToAttentionCards(query.data),
    [query.data]
  );

  return {
    cards,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
}
