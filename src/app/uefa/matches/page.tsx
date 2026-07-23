import { getFootballMatches } from "@/data/providers/football-matches";
import { HomeMatchesPanel } from "@/views/home";

export default async function UEFAMatchesPage() {
  const { matches, meta: matchesMeta } = await getFootballMatches();

  return <HomeMatchesPanel matches={matches} matchesMeta={matchesMeta} />;
}
