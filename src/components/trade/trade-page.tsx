"use client";

import type { MarketDataMeta } from "@/data/providers/types";
import type { NormalizedBookmakerOdds } from "@/data/odds/types";
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
  TeamMarketSnapshot,
  WorldCupMatch
} from "@/types/market";
import { TradeTeamProView } from "@/views/trade";

export interface TradePageProps {
  snapshot: TeamMarketSnapshot;
  probabilityHistory: ProbabilityHistoryPoint[];
  matches: WorldCupMatch[];
  snapshots: TeamMarketSnapshot[];
  relatedNews?: NewsEvent[];
  footballProfile?: ApiFootballTeamProfile;
  footballFixtures?: ApiFootballFixtureContext[];
  footballSquad?: ApiFootballSquadPlayer[];
  footballInjuries?: ApiFootballInjuryContext[];
  footballStandings?: ApiFootballStandingContext[];
  footballOdds?: ApiFootballOddContext[];
  outrightOdds?: NormalizedBookmakerOdds[];
  footballDataIssues?: ApiFootballDataIssue[];
  footballMetadata?: TeamFootballMetadata;
  allFootballMetadata?: TeamFootballMetadata[];
  dataStatus: MarketDataMeta;
}

export function TradePage({
  snapshot,
  probabilityHistory,
  matches,
  snapshots,
  footballProfile,
  footballMetadata,
  dataStatus
}: TradePageProps) {
  return (
    <TradeTeamProView
      snapshot={snapshot}
      probabilityHistory={probabilityHistory}
      matches={matches}
      snapshots={snapshots}
      footballProfile={footballProfile}
      footballMetadata={footballMetadata}
      dataStatus={dataStatus}
    />
  );
}
