"use client";

import type { MarketDataMeta } from "@/data/providers/types";
import { TeamDetailView } from "@/views/team";
import type { TeamMarketSnapshot } from "@/types/market";

export interface TeamDetailPageProps {
  snapshot: TeamMarketSnapshot;
  dataStatus: MarketDataMeta;
}

export function TeamDetailPage(props: TeamDetailPageProps) {
  return <TeamDetailView {...props} />;
}
