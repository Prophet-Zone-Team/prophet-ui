import type { ProphetAnalyticsNewsArticle } from "@/types/prophet-api";
import type { RelatedNewsItem } from "@/views/trade/game/related-news/types";

import { NEWS_HIGH_IMPACT_THRESHOLD } from "./config";
import { parseJsonArrayField } from "./map-news";
import { resolveTeamCode, type TeamCodeLookup } from "./map-team-power-ranking";

function buildThumbnailAlt(
  matchedPlayers: string[],
  title: string | undefined
): string {
  if (matchedPlayers[0]) {
    return matchedPlayers[0];
  }

  return title?.split(/\s+/).slice(0, 2).join(" ") ?? "News";
}

export function mapTeamRelatedNewsArticleToItem(
  article: ProphetAnalyticsNewsArticle,
  teamCodeLookup?: TeamCodeLookup
): RelatedNewsItem {
  const matchedTeams = parseJsonArrayField(article.matched_teams_json);
  const matchedPlayers = parseJsonArrayField(article.matched_players_json);
  const teamName = matchedTeams[0] ?? "World Cup";
  const apiScore = article.score ?? 0;

  return {
    id: String(article.id ?? ""),
    teamCode: resolveTeamCode(teamName, teamCodeLookup),
    teamName,
    headline: article.title ?? "",
    thumbnailUrl: article.url_to_image || undefined,
    thumbnailAlt: buildThumbnailAlt(matchedPlayers, article.title),
    highlighted: apiScore >= NEWS_HIGH_IMPACT_THRESHOLD
  };
}

export function mapTeamRelatedNewsArticles(
  articles: ProphetAnalyticsNewsArticle[] | undefined,
  teamCodeLookup?: TeamCodeLookup
): RelatedNewsItem[] {
  return (articles ?? []).map((article) =>
    mapTeamRelatedNewsArticleToItem(article, teamCodeLookup)
  );
}
