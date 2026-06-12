import { notFound } from "next/navigation";

import { TeamDetailPage } from "@/components/team/team-detail-page";
import { getTeamMarketSnapshot } from "@/data/providers/world-cup-market-data";
import { resolveTeamDetailSlug } from "@/lib/routes/team";

interface TeamPageProps {
  searchParams: Promise<{
    slug?: string;
  }>;
}

export default async function Page({ searchParams }: TeamPageProps) {
  const { slug } = await searchParams;

  if (!slug) {
    notFound();
  }

  const result = await getTeamMarketSnapshot(resolveTeamDetailSlug(slug));

  if (!result) {
    notFound();
  }

  return (
    <TeamDetailPage snapshot={result.snapshot} dataStatus={result.meta} />
  );
}
