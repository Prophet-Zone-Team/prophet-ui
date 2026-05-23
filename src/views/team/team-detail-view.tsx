"use client";

import { useMemo } from "react";

import type { MarketDataMeta } from "../../data/providers/types";
import type { NormalizedBookmakerOdds } from "../../data/odds/types";
import {
  getKeyPlayers,
  getNextFixture,
  getRecentMatches,
  getStrengthMetrics
} from "../../lib/team/team-detail-model";
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
} from "../../types/market";
import { TradeWidget } from "../trade/trade-widget";
import { DossierStrip } from "./dossier-strip";
import { TeamDetailFootnote } from "./team-detail-footnote";
import { TeamDetailHeader } from "./team-detail-header";
import { TeamKeyPlayersPanel } from "./team-key-players-panel";
import { TeamLineupPanel } from "./team-lineup-panel";
import { TeamMarketIntelligencePanel } from "./team-market-intelligence-panel";
import { TeamNewsSignalsPanel } from "./team-news-signals-panel";
import { TeamNextMatchPanel } from "./team-next-match-panel";
import { TeamOddsComparisonPanel } from "./team-odds-comparison-panel";
import { TeamProbabilityPanel } from "./team-probability-panel";
import { TeamRecentMatchesPanel } from "./team-recent-matches-panel";
import { TeamStrengthPanel } from "./team-strength-panel";
import {
  teamMainColumnClass,
  teamMainGridClass,
  teamPageClass,
  teamSidebarClass,
  teamTwoUpClass
} from "./team-detail-ui";

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
