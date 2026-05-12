import { BriefPage } from "../../components/brief/BriefPage";
import { parseMarketDataSource } from "../../data/providers/source";
import { getWorldCupMarketData } from "../../data/providers/worldCupMarketData";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: Promise<{
    source?: string | string[];
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const marketData = await getWorldCupMarketData({ source: parseMarketDataSource(params?.source) });

  return (
    <BriefPage
      snapshots={marketData.snapshots}
      newsEvents={marketData.newsEvents}
      dataStatus={marketData.meta}
    />
  );
}
