import type { ProphetAnalyticsNewsImpact, ProphetAnalyticsTopCategoryItem } from "@/types/prophet-api";
import type { SignalSummaryStats } from "@/views/analytics/news/types";
import type { ImpactDistributionOverviewData } from "@/views/signal/overview/types";
import type { TopCategoriesData } from "@/views/signal/top-categories/types";

function toNumber(value: number | undefined): number {
  return Number.isFinite(value) ? (value as number) : 0;
}

function toCategoryLabel(value: string | undefined): string {
  if (!value) {
    return "General";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function mapTopCategoryImpactToSummary(
  impact: ProphetAnalyticsNewsImpact | undefined
): SignalSummaryStats {
  const positive = toNumber(impact?.positive);
  const negative = toNumber(impact?.negative);
  const highImpact = toNumber(impact?.high_impact);

  return {
    todaySignal: positive + negative + highImpact,
    positive,
    negative,
    highImpact
  };
}

export function mapTopCategoryImpactToCategories(
  topCategories: ProphetAnalyticsTopCategoryItem[] | undefined
): TopCategoriesData {
  return {
    categories: (topCategories ?? []).map((item) => ({
      id: item.category ?? "general",
      label: toCategoryLabel(item.category),
      count: toNumber(item.total),
      percent: toNumber(item.percent)
    }))
  };
}

export function mapTopCategoryImpactToOverview(
  impact: ProphetAnalyticsNewsImpact | undefined
): ImpactDistributionOverviewData {
  return {
    segments: [
      { sentiment: "positive", count: toNumber(impact?.positive) },
      { sentiment: "neutral", count: toNumber(impact?.neutral) },
      { sentiment: "negative", count: toNumber(impact?.negative) }
    ]
  };
}
