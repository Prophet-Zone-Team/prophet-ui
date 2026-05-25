import { notFound } from "next/navigation";

import { TeamDetailPage } from "@/components/team/team-detail-page";
import { getTheOddsApiWorldCupWinnerOdds } from "@/data/odds/the-odds-api-provider";
import { getWorldCupMarketData } from "@/data/providers/world-cup-market-data";

export const runtime = "edge";

interface TeamPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function Page({ params }: TeamPageProps) {
  const { slug } = await params;
  const [marketData, oddsData] = await Promise.all([
    getWorldCupMarketData({
      footballContextTeamIds: [slug],
      includeFootballContext: true
    }),
    getTheOddsApiWorldCupWinnerOdds()
  ]);
  const snapshot = marketData.snapshots.find((item) => item.team.id === slug);

  if (!snapshot) {
    notFound();
  }

  const probabilityHistory = marketData.probabilityHistory.filter(
    (point) => point.teamId === snapshot.team.id
  );
  const relatedNews = marketData.newsEvents.filter(
    (event) => event.teamId === snapshot.team.id
  );
  const footballContext = marketData.footballTeamContext.find(
    (context) => context.profile.teamId === snapshot.team.id
  );
  const footballProfile =
    footballContext?.profile ??
    marketData.footballContext.find((profile) => profile.teamId === snapshot.team.id);

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
      outrightOdds={oddsData.odds.filter((item) => item.teamId === snapshot.team.id)}
      footballDataIssues={footballContext?.dataIssues ?? []}
      footballMetadata={marketData.footballMetadata.find(
        (metadata) => metadata.teamId === snapshot.team.id
      )}
      allFootballMetadata={marketData.footballMetadata}
      dataStatus={marketData.meta}
    />
  );
}
