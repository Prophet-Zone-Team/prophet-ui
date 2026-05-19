import { MatchesPage } from "../../components/matches/MatchesPage";
import { DEFAULT_MARKET_DATA_SOURCE } from "../../data/providers/source";

export default async function Page() {
  return <MatchesPage source={DEFAULT_MARKET_DATA_SOURCE} />;
}
