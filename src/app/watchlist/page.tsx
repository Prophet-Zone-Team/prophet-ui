import { getWorldCupMarketData } from "../../data/providers/worldCupMarketData";
import { WatchlistPage } from "../../components/watchlist/WatchlistPage";

export const dynamic = "force-dynamic";

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
