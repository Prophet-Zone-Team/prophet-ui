import { notFound } from "next/navigation";

import { fetchGroupWinnerMarketData } from "@/lib/market/fetch-group-winner-market-data";
import {
  buildStaticGroupSnapshots,
  mapGroupWinnerEventToHeader,
} from "@/lib/market/map-group-winner-event";
import { resolveGroupCodeFromParam } from "@/lib/routes/group";
import { GroupDetailView } from "@/views/group-detail";

interface GroupPageProps {
  searchParams: Promise<{
    n?: string;
  }>;
}

export default async function GroupPage({ searchParams }: GroupPageProps) {
  const { n } = await searchParams;
  const group = resolveGroupCodeFromParam(n);

  if (!group) {
    notFound();
  }

  const marketData = await fetchGroupWinnerMarketData(group);
  const initialSnapshots =
    marketData?.snapshots ?? buildStaticGroupSnapshots(group);
  const initialHeader =
    marketData?.header ??
    mapGroupWinnerEventToHeader(
      {
        slug: `world-cup-group-${group.toLowerCase()}-winner`,
        title: `Group ${group}`,
      },
      group,
    );

  return (
    <GroupDetailView
      group={group}
      initialSnapshots={initialSnapshots}
      initialHeader={initialHeader}
    />
  );
}
