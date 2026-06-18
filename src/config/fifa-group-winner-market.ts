import type { WorldCup2026Group } from "@/data/world-cup-2026/groups";

export function resolveGroupWinnerEventSlug(group: WorldCup2026Group): string {
  return `world-cup-group-${group.toLowerCase()}-winner`;
}

/** Same pattern as {@link FIFA_WINNER_EVENT_PATH}. */
export function resolveGroupWinnerEventPath(group: WorldCup2026Group): string {
  return `/events/slug/${resolveGroupWinnerEventSlug(group)}`;
}

export function resolveGroupWinnerGammaEventsQueryPath(group: WorldCup2026Group): string {
  return `/events?slug=${encodeURIComponent(resolveGroupWinnerEventSlug(group))}`;
}
