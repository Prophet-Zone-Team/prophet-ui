import { getFootballMatches } from "@/data/providers/football-matches";
import { getWorldCupMarketData } from "@/data/providers/world-cup-market-data";
import { TracksView } from "@/views/tracks";

export default async function TracksPage() {
  const [marketData, { matches }] = await Promise.all([
    getWorldCupMarketData({
      includeFootballContext: false,
      includeNews: false,
    }),
    getFootballMatches(),
  ]);

  return (
    <TracksView
      snapshots={marketData.snapshots}
      matches={matches}
      dataStatus={marketData.meta}
    />
  );
}
