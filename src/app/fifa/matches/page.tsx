import { getFootballMatches } from "@/data/providers/football-matches";
import { getWorldCupMarketData } from "@/data/providers/world-cup-market-data";
import { HomeMatchesPanel, sortHomeTeams } from "@/views/home";

export default async function FifaMatchesPage() {
  const [marketData, { matches, meta: matchesMeta }] = await Promise.all([
    getWorldCupMarketData({
      includeFootballContext: false,
      includeNews: false,
      includeOdds: false
    }),
    getFootballMatches()
  ]);
  const teams = sortHomeTeams(marketData.snapshots);

  return (
    <HomeMatchesPanel
      matches={matches}
      matchesMeta={matchesMeta}
      snapshots={teams}
    />
  );
}
