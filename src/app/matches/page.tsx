import { MatchesPage } from "../../components/matches/MatchesPage";
import { parseMarketDataSource } from "../../data/providers/source";

interface PageProps {
  searchParams?: Promise<{
    source?: string | string[];
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;

  return <MatchesPage source={parseMarketDataSource(params?.source)} />;
}
