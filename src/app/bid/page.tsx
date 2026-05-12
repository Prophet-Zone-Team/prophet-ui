import { mockTeamMarketSnapshots } from "../../data/mock/teams";
import { BidPage } from "../../components/bid/BidPage";

export default function Page() {
  return <BidPage snapshots={mockTeamMarketSnapshots} />;
}
