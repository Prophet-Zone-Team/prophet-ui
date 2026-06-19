import {
  getWorldCupTeamByIdOrCode,
  WORLD_CUP_2026_GROUP_ORDER,
  type WorldCup2026Group,
} from "@/data/world-cup-2026/groups";
import type { OrderOutcomeSide } from "@/types/market";

export function groupDetailHref(
  group: WorldCup2026Group,
  options?: {
    team?: string;
    side?: OrderOutcomeSide;
  },
): string {
  const params = new URLSearchParams({
    n: group.toLowerCase(),
  });

  if (options?.team) {
    params.set("team", options.team);
  }

  if (options?.side) {
    params.set("side", options.side);
  }

  return `/group?${params.toString()}`;
}

export function resolveGroupDetailTeamParam(
  value: string | undefined,
): string | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  return getWorldCupTeamByIdOrCode(value.trim())?.id ?? value.trim();
}

export function resolveGroupCodeFromParam(
  value: string | undefined,
): WorldCup2026Group | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toUpperCase();

  return WORLD_CUP_2026_GROUP_ORDER.find((group) => group === normalized);
}
