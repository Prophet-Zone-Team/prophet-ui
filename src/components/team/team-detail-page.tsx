"use client";

import { TrackedTeamRevisitEffect } from "@/components/analytics/tracked-team-revisit-effect";
import { MarketWsProvider } from "@/context/market-ws";
import type { MarketDataMeta } from "@/data/providers/types";
import { TeamDetailView } from "@/views/team";
import type { TeamMarketSnapshot } from "@/types/market";

export interface TeamDetailPageProps {
  snapshot: TeamMarketSnapshot;
  dataStatus: MarketDataMeta;
  mobileBackEntry?: "trade";
}

export function TeamDetailPage({
  snapshot,
  dataStatus,
  mobileBackEntry
}: TeamDetailPageProps) {
  const yesTokenId = snapshot.market.polymarket?.tokens.yes?.tokenId;
  const noTokenId = snapshot.market.polymarket?.tokens.no?.tokenId;
  const marketWsEnabled = Boolean(yesTokenId || noTokenId);

  return (
    <MarketWsProvider enabled={marketWsEnabled}>
      <TrackedTeamRevisitEffect
        teamId={snapshot.team.id}
        teamName={snapshot.team.name}
        teamCode={snapshot.team.code}
        slug={snapshot.market.slug}
        entrySource="team_detail_page"
      />
      <TeamDetailView
        snapshot={snapshot}
        dataStatus={dataStatus}
        mobileBackEntry={mobileBackEntry}
      />
    </MarketWsProvider>
  );
}
