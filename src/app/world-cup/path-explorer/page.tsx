import { PathExplorerPage } from "../../../components/world-cup/PathExplorerPage";

interface PageProps {
  searchParams: Promise<{
    team?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  return <PathExplorerPage initialTeamId={params.team ?? "brazil"} />;
}
