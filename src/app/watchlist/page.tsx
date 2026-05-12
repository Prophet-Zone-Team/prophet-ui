import { mockNewsEvents, mockTeamMarketSnapshots } from "../../data/mock/teams";
import { WatchlistPage } from "../../components/watchlist/WatchlistPage";

export default function Page() {
  return <WatchlistPage snapshots={mockTeamMarketSnapshots} newsEvents={mockNewsEvents} />;
}
