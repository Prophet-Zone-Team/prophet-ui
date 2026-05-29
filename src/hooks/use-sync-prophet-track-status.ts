"use client";

import { useCallback, useEffect } from "react";

import { useAuth } from "@/context/auth";
import { hydrateTrackStatusFromListItems } from "@/lib/tracks/track-status";
import {
  getProphetTrackList,
  isProphetAuthenticated,
  syncProphetWalletLogin
} from "@/service/prophet";
import { useAuthHydrated } from "@/store/use-auth-hydrated";

export function useSyncProphetTrackStatus(): void {
  const authHydrated = useAuthHydrated();
  const { session } = useAuth();
  const walletAddress = session?.walletAddress;

  const syncTrackStatus = useCallback(async () => {
    if (!walletAddress) {
      return;
    }

    try {
      await syncProphetWalletLogin(walletAddress);

      if (!isProphetAuthenticated()) {
        return;
      }

      const items = await getProphetTrackList();
      hydrateTrackStatusFromListItems(items ?? []);
    } catch (error) {
      console.warn("[track-status] failed to sync user track list", error);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (!authHydrated) {
      return;
    }

    void syncTrackStatus();
  }, [authHydrated]);
}
