import type { ProphetAnalyticsRecommend } from "@/types/prophet-api";
import type { TopAnalyticsCardContent } from "@/views/analytics/top/card";

import {
  RECOMMEND_CATEGORY_LABELS,
  RECOMMEND_CATEGORY_ORDER,
  type RecommendCategory
} from "./config";
import { resolveTeamCode, type TeamCodeLookup } from "./map-team-power-ranking";
import { teamDetailHref } from "../routes/team";
import teamData from "@/data/teams/index";
import { curatedTeamKeyToId } from "@/data/teams/curated-team-list";

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

    const currentTeam = teamData[item.team as keyof typeof teamData];
    const teamId = curatedTeamKeyToId(currentTeam?.name ?? item.team);
    const teamName = item.team;

    return [
      {
        categoryLabel: RECOMMEND_CATEGORY_LABELS[category],
        teamCode: resolveTeamCode(teamName, teamCodeLookup),
        teamName,
        description: item.reason ?? "",
        iconKey: RECOMMEND_ICON_KEYS[category],
        link: teamDetailHref(teamId),
      }
    ];
  });
}
