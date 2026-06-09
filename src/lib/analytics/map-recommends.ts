import type { ProphetAnalyticsRecommend } from "@/types/prophet-api";
import type { TopAnalyticsCardContent } from "@/views/analytics/top/card";

import {
  RECOMMEND_CATEGORY_LABELS,
  RECOMMEND_CATEGORY_ORDER,
  type RecommendCategory
} from "./config";
import { resolveTeamCode, type TeamCodeLookup } from "./map-team-power-ranking";
import { buildTeamDetailHref } from "../routes/team";

const RECOMMEND_ICON_KEYS: Record<RecommendCategory, string> = {
  mostLikelyChampion: "champion",
  darkHorse: "darkHorse",
  hardestPath: "hardestPath",
  topAdvantage: "topAdvantage"
};

function isRecommendCategory(value: string): value is RecommendCategory {
  return (RECOMMEND_CATEGORY_ORDER as readonly string[]).includes(value);
}

export function mapRecommendsResponse(
  items: ProphetAnalyticsRecommend[] | undefined,
  teamCodeLookup?: TeamCodeLookup
): TopAnalyticsCardContent[] {
  const byCategory = new Map<RecommendCategory, ProphetAnalyticsRecommend>();

  for (const item of items ?? []) {
    const category = item.category;

    if (category && isRecommendCategory(category)) {
      byCategory.set(category, item);
    }
  }

  return RECOMMEND_CATEGORY_ORDER.flatMap((category) => {
    const item = byCategory.get(category);

    if (!item?.team) {
      return [];
    }

    const teamName = item.team;
    const teamLink = buildTeamDetailHref(item.team);

    return [
      {
        categoryLabel: RECOMMEND_CATEGORY_LABELS[category],
        teamCode: resolveTeamCode(teamName, teamCodeLookup),
        teamName,
        description: item.reason ?? "",
        iconKey: RECOMMEND_ICON_KEYS[category],
        link: teamLink,
      }
    ];
  });
}
