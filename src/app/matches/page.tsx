import { getFootballMatches } from "@/data/providers/football-matches";
import { HomeMatchesPanel } from "@/views/home";
import { LALIGA_GAMES_LEAGUE } from "@/views/home/matches/config";

export default async function MatchesPage() {
  const { matches, meta: matchesMeta } = await getFootballMatches({
    league: LALIGA_GAMES_LEAGUE,
    ended: false
  });

  return (
    <HomeMatchesPanel
      matches={matches}
      matchesMeta={matchesMeta}
      league={LALIGA_GAMES_LEAGUE}
    />
  );
}
