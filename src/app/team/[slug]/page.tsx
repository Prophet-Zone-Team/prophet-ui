import { notFound } from "next/navigation";

import {
  mockNewsEvents,
  mockProbabilityHistory,
  mockTeamMarketSnapshots,
} from "../../../data/mock/teams";
import { TeamDetailPage } from "../../../components/team/TeamDetailPage";

interface TeamPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export function generateStaticParams() {
  return mockTeamMarketSnapshots.map((snapshot) => ({
    slug: snapshot.team.id,
  }));
}

export default async function Page({ params }: TeamPageProps) {
  const { slug } = await params;
  const snapshot = mockTeamMarketSnapshots.find((item) => item.team.id === slug);

  if (!snapshot) {
    notFound();
  }

  const probabilityHistory = mockProbabilityHistory.filter((point) => point.teamId === snapshot.team.id);
  const relatedNews = mockNewsEvents.filter((event) => event.teamId === snapshot.team.id);

  return (
    <TeamDetailPage
      snapshot={snapshot}
      probabilityHistory={probabilityHistory}
      relatedNews={relatedNews}
    />
  );
}
