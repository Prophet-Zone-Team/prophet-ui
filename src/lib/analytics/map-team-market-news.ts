import type { TeamMarketSnapshot } from "@/types/market";
import type {
  ProphetAnalyticsNewsArticle,
  ProphetAnalyticsTeamMarket
} from "@/types/prophet-api";
import type { NewsImpactItem } from "@/views/analytics/news/types";
import { mapNewsArticleToImpactItem, parseJsonArrayField } from "@/lib/analytics/map-news";
import type { TeamCodeLookup } from "@/lib/analytics/map-team-power-ranking";

export interface TeamMarketIntelligenceData {
  probability: number;
  change24h: number;
  change7d: number;
  volume: number;
  liquidity: number;
  sentiment: TeamMarketSnapshot["market"]["sentiment"];
  updatedAt?: string;
}

function parseNumeric(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseOutcomePrices(outcomePrices: string | undefined): number[] {
  return parseJsonArrayField(outcomePrices)
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
}

function resolveSentiment(change24h: number): TeamMarketSnapshot["market"]["sentiment"] {
  if (change24h > 0.01) {
    return "bullish";
  }

  if (change24h < -0.01) {
    return "bearish";
  }

  return "neutral";
}

export function mapTeamMarketNewsToIntelligence(
  market: ProphetAnalyticsTeamMarket | undefined
): TeamMarketIntelligenceData {
  const prices = parseOutcomePrices(market?.outcomePrices);
  const change24h = parseNumeric(market?.oneDayPriceChange);

  return {
    probability: prices[0] ?? 0,
    change24h,
    change7d: parseNumeric(market?.oneWeekPriceChange),
    volume: parseNumeric(market?.volume),
    liquidity: parseNumeric(market?.liquidity),
    sentiment: resolveSentiment(change24h),
    updatedAt: market?.updatedAt
  };
}

export function mapTeamMarketNewsToImpactItems(
  news: ProphetAnalyticsNewsArticle[] | undefined,
  teamName: string,
  teamCodeLookup?: TeamCodeLookup
): NewsImpactItem[] {
  return (news ?? []).map((article, index) =>
    mapNewsArticleToImpactItem(article, teamCodeLookup, {
      highlighted: index === 0,
      homeTeamName: teamName
    })
  );
}

export function getTeamMarketMovementNarrative(
  teamName: string,
  change24h: number,
  relatedNewsCount: number
): string {
  const direction = change24h >= 0 ? "rose" : "fell";
  const delta = Math.abs(change24h);
  const changeLabel = `${change24h >= 0 ? "+" : "-"}${(delta * 100).toFixed(1)}%`;
  const newsCopy =
    relatedNewsCount > 0
      ? `${relatedNewsCount} related news item${relatedNewsCount === 1 ? "" : "s"} are attached.`
      : "No qualifying news item is attached yet.";

  return `${teamName} probability ${direction} ${changeLabel} in the latest window. ${newsCopy} This is correlation context, not causation.`;
}
