"use client";

import { TrackedTeamRevisitEffect } from "@/components/analytics/tracked-team-revisit-effect";
import type { MarketDataMeta } from "@/data/providers/types";
import { TeamDetailView } from "@/views/team";
import type { TeamMarketSnapshot } from "@/types/market";

export interface TeamDetailPageProps {
  snapshot: TeamMarketSnapshot;
  dataStatus: MarketDataMeta;
}

export function TeamDetailPage({ snapshot, dataStatus }: TeamDetailPageProps) {
  return (
    <>
      <TrackedTeamRevisitEffect
        teamId={snapshot.team.id}
        teamName={snapshot.team.name}
        teamCode={snapshot.team.code}
        slug={snapshot.market.slug}
        entrySource="team_detail_page"
      />
      <TeamDetailView snapshot={snapshot} dataStatus={dataStatus} />
    </>
  );
}
