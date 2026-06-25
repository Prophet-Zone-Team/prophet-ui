import {
  getScheduleRowVariant,
  isEndedMatchStatus,
} from "@/lib/market/schedule-match";
import type { MatchLiveSnapshot } from "@/lib/market/sports-ws-live-state";
import { resolveMatchLiveKeys } from "@/lib/market/sports-ws-live-state";
import type { ComboGameGroup, ComboMarketsDay } from "@/types/combo";
import type { WorldCupMatch } from "@/types/market";

export function comboGameGroupToWorldCupMatch(
  group: ComboGameGroup,
): WorldCupMatch {
  return {
    id: group.slug,
    eventId: group.eventId,
    stage: "EXTERNAL",
    status: group.status,
    kickoffAt: group.kickoffAt,
    homeScore: group.homeScore,
    awayScore: group.awayScore,
    homeDisplayName: group.homeTeam.name,
    awayDisplayName: group.awayTeam.name,
    freshness: {
      source: "combo-markets",
      status: "live",
    },
  };
}

export function resolveComboGroupLiveKeys(group: ComboGameGroup): string[] {
  return resolveMatchLiveKeys(comboGameGroupToWorldCupMatch(group));
}

export function mergeComboGroupWithLiveSnapshot(
  group: ComboGameGroup,
  snapshot: MatchLiveSnapshot | undefined,
): ComboGameGroup {
  if (!snapshot) {
    return group;
  }

  return {
    ...group,
    homeScore: snapshot.homeScore ?? group.homeScore,
    awayScore: snapshot.awayScore ?? group.awayScore,
    status: snapshot.status,
  };
}

export function isComboGameLive(group: ComboGameGroup): boolean {
  return getScheduleRowVariant(group.status) === "ongoing";
}

export function filterComboGroupsForDay(
  groups: ComboGameGroup[],
  day: ComboMarketsDay,
): ComboGameGroup[] {
  if (day !== "today") {
    return groups;
  }

  return groups.filter((group) => !isEndedMatchStatus(group.status));
}
