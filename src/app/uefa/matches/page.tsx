import { getFootballMatches } from "@/data/providers/football-matches";
import { HomeMatchesPanel } from "@/views/home";
import { UEFA_GAMES_LEAGUE } from "@/views/home/matches/config";

export default async function UEFAMatchesPage() {
  const { matches, meta: matchesMeta } = await getFootballMatches({
    league: UEFA_GAMES_LEAGUE,
    ended: false
  });

  return (
    <HomeMatchesPanel
      matches={matches}
      matchesMeta={matchesMeta}
      league={UEFA_GAMES_LEAGUE}
    />
  );
}
