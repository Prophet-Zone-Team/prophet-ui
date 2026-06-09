import type { ProphetAnalyticsNewsArticle } from "@/types/prophet-api";
import type { RelatedNewsItem } from "@/views/trade/game/related-news/types";

import { mapNewsArticleToImpactItem } from "./map-news";
import type { TeamCodeLookup } from "./map-team-power-ranking";

export function mapTeamRelatedNewsArticleToItem(
  article: ProphetAnalyticsNewsArticle,
  teamCodeLookup?: TeamCodeLookup,
  options?: { homeTeamName?: string; awayTeamName?: string; }
): RelatedNewsItem {
  return mapNewsArticleToImpactItem(article, teamCodeLookup, options);
}

export function mapTeamRelatedNewsArticles(
  articles: ProphetAnalyticsNewsArticle[] | undefined,
  teamCodeLookup?: TeamCodeLookup,
  options?: { homeTeamName?: string; awayTeamName?: string; }
): RelatedNewsItem[] {
  return (articles ?? []).map((article) =>
    mapTeamRelatedNewsArticleToItem(article, teamCodeLookup, options)
  );
}
