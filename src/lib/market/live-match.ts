import { isMockLiveFixtureEnabled } from "@/lib/market/mock-live-fixture-config";
import { getScheduleRowVariant } from "@/lib/market/schedule-match";
import type { WorldCupMatch } from "@/types/market";

export function isEffectiveLiveMatch(match: WorldCupMatch): boolean {
  return getScheduleRowVariant(match.status) === "ongoing";
}

/** Whether game market prices should stream from Polymarket market WS. */
export function isGameMarketLiveUpdatesEnabled(match: WorldCupMatch): boolean {
  return isEffectiveLiveMatch(match) || isMockLiveFixtureEnabled();
}
