import { mockNewsEvents, mockTeamMarketSnapshots } from "../../data/mock/teams";
import { FeedPage } from "../../components/feed/FeedPage";

export default function Page() {
  return <FeedPage snapshots={mockTeamMarketSnapshots} newsEvents={mockNewsEvents} />;
}
