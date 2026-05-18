import { getWorldCupMarketData } from "../../data/providers/worldCupMarketData";
import { BidPage } from "../../components/bid/BidPage";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: Promise<{
    team?: string | string[];
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const team = Array.isArray(params?.team) ? params.team[0] : params?.team;
  const marketData = await getWorldCupMarketData({
    source: "polymarket",
    includeNews: false,
    includeFootballContext: false,
  });

  return <BidPage snapshots={marketData.snapshots} dataStatus={marketData.meta} initialTeamId={team} />;
}
