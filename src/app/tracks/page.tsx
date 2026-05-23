import { getWorldCupMarketData } from "../../data/providers/world-cup-market-data";
import {
  attachCachedFootballToMatches,
  getStaticWorldCupMatches
} from "../../data/world-cup-2026/matches";
import { TracksView } from "../../views/tracks";

export const dynamic = "force-dynamic";

export default async function TracksPage() {
  const marketData = await getWorldCupMarketData({
    includeFootballContext: true,
    includeNews: false
  });
  const matches = attachCachedFootballToMatches(
    getStaticWorldCupMatches(),
    marketData.footballTeamContext
  );

  return (
    <TracksView
      snapshots={marketData.snapshots}
      matches={matches}
      dataStatus={marketData.meta}
    />
  );
}
