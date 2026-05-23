import type { Metadata } from "next";

import { NewsPage } from "@/components/news/news-page";
import { getWorldCupMarketData } from "@/data/providers/world-cup-market-data";
import { getSignalDataRepository } from "@/server/signal-data/repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "World Cup News Context | Prophet",
  description: "World Cup team news context, market signals, and related source links.",
  alternates: {
    canonical: "/news",
  },
};

export default async function Page() {
  const [marketData, repository] = await Promise.all([
    getWorldCupMarketData({ includeFootballContext: false }),
    getSignalDataRepository(),
  ]);
  const articles = await repository.readNewsArticles({ days: 90, limit: 80 });

  return <NewsPage articles={articles} snapshots={marketData.snapshots} />;
}
