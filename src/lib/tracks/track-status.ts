import { useTrackStatusStore } from "@/store/track-status-store";
import type {
  ProphetCancelTrackRequest,
  ProphetTrackRequest,
  ProphetUserTrackItem,
  ProphetUserTrackListItem
} from "@/types/prophet-api";

export type { ProphetBookmarkTarget } from "@/lib/tracks/track-status-keys";
export {
  buildTrackStatusMapFromApiItems,
  resolveTrackStoreKeyFromApiItem,
  resolveTrackStoreKeyFromTarget,
  trackItemMatchesBookmarkTarget
} from "@/lib/tracks/track-status-keys";

import type { ProphetBookmarkTarget } from "@/lib/tracks/track-status-keys";

export function buildTrackRequest(
  target: ProphetBookmarkTarget
): ProphetTrackRequest {
  if (target.category === "team") {
    return {
      category: "team",
      slug: target.slug,
      team_name: target.teamName
    };
  }

  return {
    category: "game",
    slug: target.slug,
    team_name: `${target.homeTeamName},${target.awayTeamName}`
  };
}

export function buildUntrackRequest(
  target: ProphetBookmarkTarget
): ProphetCancelTrackRequest {
  return { slug: target.slug };
}

export function hydrateTrackStatusFromApiItems(
  items: ProphetUserTrackItem[]
): void {
  useTrackStatusStore.getState().hydrateFromApiItems(items);
}

export function hydrateTrackStatusFromListItems(
  items: ProphetUserTrackListItem[]
): void {
  useTrackStatusStore.getState().hydrateFromApiItems(items);
}

export function clearTrackStatus(): void {
  useTrackStatusStore.getState().clearAll();
}
