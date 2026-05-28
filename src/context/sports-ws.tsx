"use client";

import { useEffect, type ReactNode } from "react";
import { getPolymarketSportsWsClient } from "@/lib/market/polymarket-sports-ws-client";
import { useMatchLiveStore } from "@/store/match-live-store";

export interface SportsWsProviderProps {
  children: ReactNode;
}

export function SportsWsProvider({ children }: SportsWsProviderProps) {
  useEffect(() => {
    const client = getPolymarketSportsWsClient();
    const applyWsUpdate = useMatchLiveStore.getState().applyWsUpdate;

    return client.subscribe((update) => {
      applyWsUpdate(update);
    });
  }, []);

  return children;
}
