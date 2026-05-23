"use client";

import { useMemo } from "react";

import type { MarketDataMeta } from "@/data/providers/types";
import type { NormalizedBookmakerOdds } from "@/data/odds/types";
import {
  getKeyPlayers,
  getNextFixture,
  getRecentMatches,
  getStrengthMetrics
} from "@/lib/team/team-detail-model";
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
import { TradeWidget } from "@/views/trade/trade-widget";
import { DossierStrip } from "@/views/team/dossier-strip";
import { TeamDetailFootnote } from "@/views/team/team-detail-footnote";
import { TeamDetailHeader } from "@/views/team/team-detail-header";
import { TeamKeyPlayersPanel } from "@/views/team/team-key-players-panel";
import { TeamLineupPanel } from "@/views/team/team-lineup-panel";
import { TeamMarketIntelligencePanel } from "@/views/team/team-market-intelligence-panel";
import { TeamNewsSignalsPanel } from "@/views/team/team-news-signals-panel";
import { TeamNextMatchPanel } from "@/views/team/team-next-match-panel";
import { TeamOddsComparisonPanel } from "@/views/team/team-odds-comparison-panel";
import { TeamProbabilityPanel } from "@/views/team/team-probability-panel";
import { TeamRecentMatchesPanel } from "@/views/team/team-recent-matches-panel";
import { TeamStrengthPanel } from "@/views/team/team-strength-panel";
import {
  teamMainColumnClass,
  teamMainGridClass,
  teamPageClass,
  teamSidebarClass,
  teamTwoUpClass
} from "@/views/team/team-detail-ui";

export interface TeamDetailViewProps {
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

export function TeamDetailView({
  snapshot,
  probabilityHistory,
  relatedNews,
  footballProfile,
  footballFixtures,
  footballSquad,
  footballInjuries,
  footballStandings,
  footballOdds,
  outrightOdds,
  footballDataIssues,
  footballMetadata,
  allFootballMetadata,
  dataStatus
}: TeamDetailViewProps) {
  const strength = useMemo(
    () =>
      getStrengthMetrics(
        snapshot,
        footballMetadata,
        footballSquad,
        footballInjuries,
        footballStandings,
        relatedNews
      ),
    [
      snapshot,
      footballMetadata,
      footballSquad,
      footballInjuries,
      footballStandings,
      relatedNews
    ]
  );

  const keyPlayers = useMemo(
    () =>
      getKeyPlayers(footballMetadata, footballSquad, footballInjuries, snapshot),
    [footballMetadata, footballSquad, footballInjuries, snapshot]
  );

  const recentMatches = useMemo(
    () => getRecentMatches(footballFixtures),
    [footballFixtures]
  );

  const upcomingFixture = useMemo(
    () => getNextFixture(footballFixtures),
    [footballFixtures]
  );

  return (
    <div className={teamPageClass}>
      <TeamDetailHeader
        snapshot={snapshot}
        profile={footballProfile}
        metadata={footballMetadata}
      />

      <DossierStrip
        snapshot={snapshot}
        matches={recentMatches}
        fixture={upcomingFixture}
        players={keyPlayers}
        metadata={footballMetadata}
        allMetadata={allFootballMetadata}
      />

      <div className={teamMainGridClass}>
        <div className={teamMainColumnClass}>
          <div className={teamTwoUpClass}>
            <TeamStrengthPanel metrics={strength} />
            <TeamOddsComparisonPanel
              snapshot={snapshot}
              fixtureOdds={footballOdds}
              outrightOdds={outrightOdds}
              dataStatus={dataStatus}
            />
          </div>

          <TeamRecentMatchesPanel matches={recentMatches} />
          <TeamLineupPanel
            squad={footballSquad}
            injuries={footballInjuries}
            dataIssues={footballDataIssues}
          />
          <TeamKeyPlayersPanel players={keyPlayers} />
          <TeamNewsSignalsPanel news={relatedNews} snapshot={snapshot} />
        </div>

        <aside className={teamSidebarClass}>
          <TeamNextMatchPanel fixture={upcomingFixture} snapshot={snapshot} />
          <TradeWidget snapshot={snapshot} />
          <TeamProbabilityPanel
            history={probabilityHistory}
            snapshot={snapshot}
          />
          <TeamMarketIntelligencePanel
            snapshot={snapshot}
            history={probabilityHistory}
            dataStatus={dataStatus}
            relatedNewsCount={relatedNews.length}
          />
        </aside>
      </div>

      <TeamDetailFootnote dataStatus={dataStatus} />
    </div>
  );
}
