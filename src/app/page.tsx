import { getWorldCupMarketData } from "../data/providers/worldCupMarketData";
import { HomePage } from "../components/home/HomePage";

export const dynamic = "force-dynamic";

export default async function Page() {
  const marketData = await getWorldCupMarketData({ includeFootballContext: false });

  return (
    <HomePage
      snapshots={marketData.snapshots}
      newsEvents={marketData.newsEvents}
      dataStatus={marketData.meta}
      universe={marketData.universe}
    />
  );
}
