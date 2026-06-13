import {
  WORLD_CUP_2026_GROUP_ORDER,
  type WorldCup2026Group,
} from "@/data/world-cup-2026/groups";

export function groupDetailHref(group: WorldCup2026Group): string {
  return `/group?n=${encodeURIComponent(group.toLowerCase())}`;
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
