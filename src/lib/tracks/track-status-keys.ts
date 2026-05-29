import type {
  ProphetTrackCategory,
  ProphetUserTrackItem,
  ProphetUserTrackListItem,
  ProphetWorldCupTeam
} from "@/types/prophet-api";

/** Minimal fields used to resolve bookmark keys from API rows. */
export type ProphetTrackStatusItem =
  | ProphetUserTrackListItem
  | ProphetUserTrackItem
  | {
      category?: ProphetTrackCategory;
      slug?: string;
      team_name?: string;
      goals?: number[];
      team?: ProphetWorldCupTeam;
    };

export type ProphetBookmarkTarget =
  | { category: "team"; slug: string; teamName: string }
  | { category: "game"; slug: string; homeTeamName: string; awayTeamName: string };

export function resolveTrackStoreKeyFromTarget(
  target: ProphetBookmarkTarget
): string {
  if (target.category === "team") {
    return target.teamName;
  }

  return target.slug;
}

function resolveItemCategory(
  item: ProphetTrackStatusItem
): ProphetTrackCategory | undefined {
  if (item.category === "team" || item.category === "game") {
    return item.category;
  }

  if ("goals" in item && item.goals && item.goals.length > 0) {
    return "game";
  }

  return "team" in item && item.team ? "team" : "game";
}

export function resolveTrackStoreKeyFromApiItem(
  item: ProphetTrackStatusItem
): string | undefined {
  const category = resolveItemCategory(item);

  if (category === "game") {
    const slug = item.slug?.trim();

    return slug || undefined;
  }

  const teamName =
    item.team_name?.trim() ||
    ("team" in item ? item.team?.name?.trim() : undefined);

  if (teamName) {
    return teamName;
  }

  const slug = item.slug?.trim();

  return slug || undefined;
}

export function trackItemMatchesBookmarkTarget(
  item: ProphetTrackStatusItem,
  target: ProphetBookmarkTarget
): boolean {
  const itemKey = resolveTrackStoreKeyFromApiItem(item);
  const targetKey = resolveTrackStoreKeyFromTarget(target);

  return (
    itemKey !== undefined &&
    targetKey !== undefined &&
    itemKey === targetKey
  );
}

export function buildTrackStatusMapFromApiItems(
  items: ProphetTrackStatusItem[]
): Record<string, boolean> {
  const byKey: Record<string, boolean> = {};

  for (const item of items) {
    const key = resolveTrackStoreKeyFromApiItem(item);

    if (key) {
      byKey[key] = true;
    }
  }

  return byKey;
}
