import { HomeView } from "@/views/home";
import { getFootballMatches } from "@/data/providers/football-matches";
import { getWorldCupMarketData } from "@/data/providers/world-cup-market-data";

export default async function Page() {
  const [marketData, { matches, meta: matchesMeta }] = await Promise.all([
    getWorldCupMarketData({
      includeFootballContext: false,
      includeNews: false,
      includeOdds: false,
    }),
    getFootballMatches(),
  ]);

  return (
    <HomeView
      snapshots={marketData.snapshots}
      matches={matches}
      matchesMeta={matchesMeta}
      dataStatus={marketData.meta}
      probabilityHistory={marketData.probabilityHistory}
      universe={marketData.universe}
    />
  );
}
