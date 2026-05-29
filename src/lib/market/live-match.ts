import { getScheduleRowVariant } from "@/lib/market/schedule-match";
import type { WorldCupMatch } from "@/types/market";

export function isEffectiveLiveMatch(match: WorldCupMatch): boolean {
  return getScheduleRowVariant(match.status) === "ongoing";
}
