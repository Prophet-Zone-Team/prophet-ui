"use client";

import type { MarketDataMeta } from "@/data/providers/types";
import type { NormalizedBookmakerOdds } from "@/data/odds/types";
import { TeamDetailView } from "@/views/team";
import type {
  ApiFootballDataIssue,
  ApiFootballFixtureContext,
  ApiFootballInjuryContext,
  ApiFootballOddContext,
  ApiFootballSquadPlayer,
  ApiFootballStandingContext,
  ApiFootballTeamProfile,
  NewsEvent,
  ProbabilityHistoryPoint,
  TeamFootballMetadata,
  TeamMarketSnapshot
} from "@/types/market";

export interface TeamDetailPageProps {
  snapshot: TeamMarketSnapshot;
  probabilityHistory: ProbabilityHistoryPoint[];
  relatedNews: NewsEvent[];
  footballProfile?: ApiFootballTeamProfile;
  footballFixtures: ApiFootballFixtureContext[];
  footballSquad: ApiFootballSquadPlayer[];
  footballInjuries: ApiFootballInjuryContext[];
  footballStandings: ApiFootballStandingContext[];
  footballOdds: ApiFootballOddContext[];
  outrightOdds: NormalizedBookmakerOdds[];
  footballDataIssues: ApiFootballDataIssue[];
  footballMetadata?: TeamFootballMetadata;
  allFootballMetadata: TeamFootballMetadata[];
  dataStatus: MarketDataMeta;
}

export function TeamDetailPage(props: TeamDetailPageProps) {
  return <TeamDetailView {...props} />;
}
