"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getProphetTelegramBindStatus,
  isProphetAuthenticated
} from "@/service/prophet";
import { useTracksStore } from "@/store/tracks-store";

export type TracksTelegramBindLoadStatus =
  | "idle"
  | "loading"
  | "ready"
  | "error";

const initialTelegramBindState = {
  loadStatus: "idle" as TracksTelegramBindLoadStatus,
  bound: undefined as boolean | undefined,
  tgUserId: undefined as number | undefined
};

export function useTracksTelegramBind(options: {
  authHydrated: boolean;
  enabled: boolean;
  walletAddress?: string;
}) {
  const [loadStatus, setLoadStatus] = useState<TracksTelegramBindLoadStatus>(
    initialTelegramBindState.loadStatus
  );
  const [bound, setBound] = useState<boolean | undefined>(
    initialTelegramBindState.bound
  );
  const [tgUserId, setTgUserId] = useState<number | undefined>(
    initialTelegramBindState.tgUserId
  );

  const reset = useCallback(() => {
    setLoadStatus(initialTelegramBindState.loadStatus);
    setBound(initialTelegramBindState.bound);
    setTgUserId(initialTelegramBindState.tgUserId);
  }, []);

  const refresh = useCallback(async () => {
    const walletAddress = options.walletAddress;

    if (!walletAddress) {
      reset();
      return;
    }

    setLoadStatus("loading");

    try {
      await useTracksStore.getState().initializeForAccount(walletAddress);

      if (!isProphetAuthenticated()) {
        reset();
        return;
      }

      const data = await getProphetTelegramBindStatus();

      setBound(Boolean(data.bound));
      setTgUserId(data.tg_user_id);
      setLoadStatus("ready");
    } catch (error) {
      console.warn("[tracks] telegram bind status failed", error);
      setLoadStatus("error");
      setBound(undefined);
      setTgUserId(undefined);
    }
  }, [options.walletAddress, reset]);

  const setBoundOptimistic = useCallback(
    (payload: { bound: boolean; tgUserId?: number }) => {
      setBound(payload.bound);
      setTgUserId(payload.tgUserId);
      setLoadStatus("ready");
    },
    []
  );

  useEffect(() => {
    if (!options.authHydrated || !options.enabled || !options.walletAddress) {
      reset();
      return;
    }

    void refresh();
  }, [
    options.authHydrated,
    options.enabled,
    options.walletAddress,
    refresh,
    reset
  ]);

  return {
    loadStatus,
    bound,
    tgUserId,
    refresh,
    setBoundOptimistic
  };
}
