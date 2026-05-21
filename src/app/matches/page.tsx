import { MatchesPage } from "../../components/matches/MatchesPage";
import { getWorldCupMarketData } from "../../data/providers/worldCupMarketData";
import { attachCachedFootballToMatches, getStaticWorldCupMatches } from "../../data/world-cup-2026/matches";

export const dynamic = "force-dynamic";

export default async function Page() {
  const marketData = await getWorldCupMarketData({
    includeNews: false,
    includeFootballContext: true,
  });
  const matches = attachCachedFootballToMatches(getStaticWorldCupMatches(), marketData.footballTeamContext);

  return <MatchesPage matches={matches} snapshots={marketData.snapshots} dataStatus={marketData.meta} />;
}
