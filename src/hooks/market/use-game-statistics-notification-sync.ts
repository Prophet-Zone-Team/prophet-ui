"use client";

import { useEffect, useRef } from "react";

import { useGameStatistics } from "@/hooks/market/use-game-statistics";
import { mapGameStatisticsEventNotifications } from "@/lib/market/map-game-statistics-event-notifications";
import { useNotificationWsStore } from "@/store/notification-ws-store";
import type { WorldCupMatch } from "@/types/market";

type SyncState = {
  slug: string;
  seenDedupeKeys: Set<string>;
  hasBaseline: boolean;
};

function createEmptySyncState(slug: string): SyncState {
  return {
    slug,
    seenDedupeKeys: new Set(),
    hasBaseline: false,
  };
}

export function useGameStatisticsNotificationSync(params: {
  match: WorldCupMatch;
  homeTeamName: string;
  awayTeamName: string;
  enabled?: boolean;
}) {
  const { payload, slug, variant } = useGameStatistics({
    match: params.match,
    homeTeamName: params.homeTeamName,
    awayTeamName: params.awayTeamName,
  });
  const enqueueEventNotification = useNotificationWsStore(
    (state) => state.enqueueEventNotification,
  );
  const syncStateRef = useRef<SyncState>(createEmptySyncState(""));

  const shouldSync =
    (params.enabled ?? true) && variant === "ongoing" && slug.length > 0;

  useEffect(() => {
    if (!shouldSync || !payload) {
      return;
    }

    if (syncStateRef.current.slug !== slug) {
      syncStateRef.current = createEmptySyncState(slug);
    }

    const notifications = mapGameStatisticsEventNotifications(
      payload,
      params.homeTeamName,
      params.awayTeamName,
      slug,
    );
    const syncState = syncStateRef.current;

    if (!syncState.hasBaseline) {
      for (const notification of notifications) {
        syncState.seenDedupeKeys.add(notification.dedupeKey);
      }

      syncState.hasBaseline = true;
      return;
    }

    for (const notification of notifications) {
      if (syncState.seenDedupeKeys.has(notification.dedupeKey)) {
        continue;
      }

      syncState.seenDedupeKeys.add(notification.dedupeKey);
      enqueueEventNotification(notification.options, notification.dedupeKey);
    }
  }, [
    enqueueEventNotification,
    params.awayTeamName,
    params.homeTeamName,
    payload,
    shouldSync,
    slug,
  ]);
}
