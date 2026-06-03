import type { ProphetAnalyticsNewsArticle } from "@/types/prophet-api";
import type { NewsImpactItem, NewsSentiment } from "@/views/analytics/news/types";
import type { SignalNewsDetail } from "@/views/signal/news-detail/types";

import {
  NEWS_HIGH_IMPACT_THRESHOLD,
  NEWS_IMPACT_NEGATIVE_KEYWORDS,
  NEWS_IMPACT_POSITIVE_KEYWORDS
} from "./config";
import {
  formatDateMonthAndTime,
  formatRelativeTime,
  publishedAtToOrder
} from "./format-relative-time";
import { resolveTeamCode, type TeamCodeLookup } from "./map-team-power-ranking";

export function parseJsonArrayField(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry): entry is string => typeof entry === "string");
  } catch {
    return [];
  }
}

export function computeImpactScore(
  score: number,
): { impactScore: number; sentiment: NewsSentiment; } {
  // >= 55
  let sentiment: NewsSentiment = "negative";
  // const magnitude = Math.round(score - 100) / 10;
  const magnitude = score / 10;
  if (score >= 50) {
    sentiment = "positive";
  }

  return {
    impactScore: magnitude,
    sentiment,
  };
}

function formatCategoryLabel(category: string | undefined): string {
  if (!category) {
    return "General";
  }

  return category.charAt(0).toUpperCase() + category.slice(1);
}

function buildThumbnailAlt(
  matchedPlayers: string[],
  title: string | undefined
): string {
  if (matchedPlayers[0]) {
    return matchedPlayers[0];
  }

  return title?.split(/\s+/).slice(0, 2).join(" ") ?? "News";
}

function buildRelatedLabel(
  matchedTeams: string[],
  matchedPlayers: string[]
): string {
  const parts = [...matchedTeams, ...matchedPlayers].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "World Cup";
}

export function mapNewsArticleToImpactItem(
  article: ProphetAnalyticsNewsArticle,
  teamCodeLookup?: TeamCodeLookup,
  options?: {
    highlighted?: boolean;
    homeTeamName?: string;
    awayTeamName?: string;
    defaultTeamName?: string;
  }
): NewsImpactItem {
  const reasons = parseJsonArrayField(article.reasons_json);
  const matchedTeams = parseJsonArrayField(article.matched_teams_json);
  const matchedPlayers = parseJsonArrayField(article.matched_players_json);
  const category = article.category ?? "";
  const apiScore = article.score ?? 0;
  const teamName = matchedTeams?.find((team) => team.toLowerCase() === options?.homeTeamName?.toLowerCase() || team.toLowerCase() === options?.awayTeamName?.toLowerCase()) ?? options?.defaultTeamName ?? matchedTeams[0] ?? "World Cup";
  const publishedAt = article.published_at;
  const publishedAtFormatted = formatDateMonthAndTime(publishedAt);

  const { impactScore, sentiment } = computeImpactScore(apiScore);

  return {
    id: String(article.id ?? ""),
    teamCode: resolveTeamCode(teamName, teamCodeLookup),
    teamName,
    sentiment,
    headline: article.title ?? "",
    summary: article.description ?? "",
    publishedAtLabel: formatRelativeTime(publishedAt),
    impactScore,
    thumbnailUrl: article.url_to_image || undefined,
    thumbnailAlt: buildThumbnailAlt(matchedPlayers, article.title),
    highlighted:
      options?.highlighted ?? apiScore >= NEWS_HIGH_IMPACT_THRESHOLD,
    publishedAt,
    publishedAtFormatted,
    sourceUrl: article.url,
    category,
    matchedTeams,
    matchedPlayers,
    reasons
  };
}

export function mapNewsArticlesToImpactItems(
  articles: ProphetAnalyticsNewsArticle[] | undefined,
  teamCodeLookup?: TeamCodeLookup
): NewsImpactItem[] {
  return (articles ?? []).map((article, index) =>
    mapNewsArticleToImpactItem(article, teamCodeLookup, {
      highlighted: index === 0
    })
  );
}

export function mapNewsArticleToDetail(
  article: ProphetAnalyticsNewsArticle,
  listItem?: NewsImpactItem
): SignalNewsDetail {
  const matchedTeams = parseJsonArrayField(article.matched_teams_json);
  const matchedPlayers = parseJsonArrayField(article.matched_players_json);
  const category = article.category ?? "";
  const sentiment = listItem?.sentiment ?? "positive";
  const impactScore = listItem?.impactScore ?? computeImpactScore(article.score ?? 0)?.impactScore;

  const body: SignalNewsDetail["body"] = [];

  const description = article.description ?? listItem?.summary;

  if (description) {
    body.push({
      kind: "paragraph",
      segments: [{ kind: "text", value: description }]
    });
  }

  if (article.url) {
    body.push({
      kind: "paragraph",
      segments: [
        { kind: "text", value: "Read original source: " },
        { kind: "link", value: article.source_name ?? "Source", href: article.url }
      ]
    });
  }

  return {
    id: String(article.id ?? listItem?.id ?? ""),
    title: article.title ?? listItem?.headline ?? "",
    updatedAtLabel: formatRelativeTime(
      article.updated_at ?? article.published_at ?? listItem?.publishedAt
    ),
    imageUrl: article.url_to_image ?? listItem?.thumbnailUrl ?? "",
    imageAlt: buildThumbnailAlt(matchedPlayers, article.title),
    sentiment,
    impactScore,
    relatedLabel: buildRelatedLabel(matchedTeams, matchedPlayers),
    categoryLabel: formatCategoryLabel(category),
    body
  };
}

export function mapNewsArticleToAllListItem(
  article: ProphetAnalyticsNewsArticle,
  teamCodeLookup?: TeamCodeLookup
): NewsImpactItem & { publishedAtOrder: number } {
  const item = mapNewsArticleToImpactItem(article, teamCodeLookup);

  return {
    ...item,
    publishedAtOrder: publishedAtToOrder(article.published_at)
  };
}
