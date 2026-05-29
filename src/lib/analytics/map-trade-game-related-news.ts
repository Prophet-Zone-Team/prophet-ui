import type { ProphetAnalyticsNewsArticle } from "@/types/prophet-api";
import type { RelatedNewsItem } from "@/views/trade/game/related-news/types";

import { mapNewsArticleToImpactItem } from "./map-news";
import type { TeamCodeLookup } from "./map-team-power-ranking";

export function mapTeamRelatedNewsArticleToItem(
  article: ProphetAnalyticsNewsArticle,
  teamCodeLookup?: TeamCodeLookup
): RelatedNewsItem {
  return mapNewsArticleToImpactItem(article, teamCodeLookup);
}

export function mapTeamRelatedNewsArticles(
  articles: ProphetAnalyticsNewsArticle[] | undefined,
  teamCodeLookup?: TeamCodeLookup
): RelatedNewsItem[] {
  return (articles ?? []).map((article) =>
    mapTeamRelatedNewsArticleToItem(article, teamCodeLookup)
  );
}
