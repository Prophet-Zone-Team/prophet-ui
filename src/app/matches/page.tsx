import { MatchesPage } from "../../views/home/matches";
import { getWorldCupMarketData } from "../../data/providers/world-cup-market-data";
import {
  attachCachedFootballToMatches,
  getStaticWorldCupMatches
} from "../../data/world-cup-2026/matches";

export const dynamic = "force-dynamic";

export default async function Page() {
  const marketData = await getWorldCupMarketData({
    includeNews: false,
    includeFootballContext: true
  });
  const matches = attachCachedFootballToMatches(
    getStaticWorldCupMatches(),
    marketData.footballTeamContext
  );

  return (
    <MatchesPage
      matches={matches}
      snapshots={marketData.snapshots}
      dataStatus={marketData.meta}
    />
  );
}
