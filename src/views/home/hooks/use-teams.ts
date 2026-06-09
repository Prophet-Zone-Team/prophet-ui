"use client";

import { useCallback, useEffect } from "react";

import {
  useWinnerEventVolume,
  useWinnerSnapshots,
  useWinnerTeamsError,
  useWinnerTeamsStatus,
  useWinnerTeamsStore,
} from "@/store/winner-teams-store";
import type { TeamMarketSnapshot } from "@/types/market";
import type { WinnerTeamsStatus } from "@/store/winner-teams-store";

export interface UseTeamsResult {
  snapshots: TeamMarketSnapshot[];
  totalVolume: number | undefined;
  status: WinnerTeamsStatus;
  isLoading: boolean;
  error?: string;
  refetch: () => Promise<void>;
}

export function isWinnerTeamsLoading(status: WinnerTeamsStatus): boolean {
  return status === "idle" || status === "loading";
}

export function useTeams(): UseTeamsResult {
  const snapshots = useWinnerSnapshots();
  const totalVolume = useWinnerEventVolume();
  const status = useWinnerTeamsStatus();
  const error = useWinnerTeamsError();
  const fetchEvent = useWinnerTeamsStore((state) => state.fetchEvent);

  useEffect(() => {
    void fetchEvent();
  }, [fetchEvent]);

  const refetch = useCallback(async () => {
    useWinnerTeamsStore.setState({
      status: "idle",
      byTeamId: {},
      eventVolume: undefined,
      error: undefined,
    });
    await fetchEvent();
  }, [fetchEvent]);

  const isLoading = isWinnerTeamsLoading(status);

  return {
    snapshots,
    totalVolume,
    status,
    isLoading,
    error,
    refetch,
  };
}
