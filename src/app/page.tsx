import { HomeView } from "../views/home";
import { getWorldCupMarketData } from "../data/providers/worldCupMarketData";
import {
  attachCachedFootballToMatches,
  getStaticWorldCupMatches
} from "../data/world-cup-2026/matches";

export const dynamic = "force-dynamic";

export default async function Page() {
  const marketData = await getWorldCupMarketData({
    includeFootballContext: true,
    includeNews: false
  });
  const matches = attachCachedFootballToMatches(
    getStaticWorldCupMatches(),
    marketData.footballTeamContext
  );

  return (
    <HomeView
      snapshots={marketData.snapshots}
      matches={matches}
      dataStatus={marketData.meta}
      probabilityHistory={marketData.probabilityHistory}
      universe={marketData.universe}
    />
  );
}
