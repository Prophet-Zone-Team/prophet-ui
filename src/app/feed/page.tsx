import { getWorldCupMarketData } from "@/data/providers/world-cup-market-data";
import { FeedPage } from "@/components/feed/feed-page";

export const dynamic = "force-dynamic";

export default async function Page() {
  const marketData = await getWorldCupMarketData({
    includeFootballContext: false,
  });

  return (
    <FeedPage
      snapshots={marketData.snapshots}
      newsEvents={marketData.newsEvents}
      dataStatus={marketData.meta}
    />
  );
}
