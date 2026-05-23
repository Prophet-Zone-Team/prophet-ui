import { getWorldCupMarketData } from "@/data/providers/world-cup-market-data";
import { WatchlistPage } from "@/components/watchlist/watchlist-page";

export default async function Page() {
  const marketData = await getWorldCupMarketData({
    includeFootballContext: false,
  });

  return (
    <WatchlistPage
      snapshots={marketData.snapshots}
      newsEvents={marketData.newsEvents}
      dataStatus={marketData.meta}
    />
  );
}
