import { notFound } from "next/navigation";

import { getWorldCupMarketData } from "../../../data/providers/worldCupMarketData";
import { TeamDetailPage } from "../../../components/team/TeamDetailPage";

interface TeamPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function Page({ params }: TeamPageProps) {
  const { slug } = await params;
  const marketData = await getWorldCupMarketData({
    footballContextTeamIds: [slug],
  });
  const snapshot = marketData.snapshots.find((item) => item.team.id === slug);

  if (!snapshot) {
    notFound();
  }

  const probabilityHistory = marketData.probabilityHistory.filter((point) => point.teamId === snapshot.team.id);
  const relatedNews = marketData.newsEvents.filter((event) => event.teamId === snapshot.team.id);
  const footballContext = marketData.footballTeamContext.find((context) => context.profile.teamId === snapshot.team.id);
  const footballProfile = footballContext?.profile ?? marketData.footballContext.find((profile) => profile.teamId === snapshot.team.id);

  return (
    <TeamDetailPage
      snapshot={snapshot}
      probabilityHistory={probabilityHistory}
      relatedNews={relatedNews}
      footballProfile={footballProfile}
      footballFixtures={footballContext?.fixtures ?? []}
      footballSquad={footballContext?.squad ?? []}
      footballInjuries={footballContext?.injuries ?? []}
      footballStandings={footballContext?.standings ?? []}
      footballOdds={footballContext?.odds ?? []}
      footballDataIssues={footballContext?.dataIssues ?? []}
      dataStatus={marketData.meta}
    />
  );
}
