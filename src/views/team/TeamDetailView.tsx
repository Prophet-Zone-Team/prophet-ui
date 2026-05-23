"use client";

import { useMemo } from "react";

import type { MarketDataMeta } from "../../data/providers/types";
import type { NormalizedBookmakerOdds } from "../../data/odds/types";
import {
  getKeyPlayers,
  getNextFixture,
  getRecentMatches,
  getStrengthMetrics
} from "../../lib/team/teamDetailModel";
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
import { TradeWidget } from "../trade/TradeWidget";
import { DossierStrip } from "./DossierStrip";
import { TeamDetailFootnote } from "./TeamDetailFootnote";
import { TeamDetailHeader } from "./TeamDetailHeader";
import { TeamKeyPlayersPanel } from "./TeamKeyPlayersPanel";
import { TeamLineupPanel } from "./TeamLineupPanel";
import { TeamMarketIntelligencePanel } from "./TeamMarketIntelligencePanel";
import { TeamNewsSignalsPanel } from "./TeamNewsSignalsPanel";
import { TeamNextMatchPanel } from "./TeamNextMatchPanel";
import { TeamOddsComparisonPanel } from "./TeamOddsComparisonPanel";
import { TeamProbabilityPanel } from "./TeamProbabilityPanel";
import { TeamRecentMatchesPanel } from "./TeamRecentMatchesPanel";
import { TeamStrengthPanel } from "./TeamStrengthPanel";
import {
  teamMainColumnClass,
  teamMainGridClass,
  teamPageClass,
  teamSidebarClass,
  teamTwoUpClass
} from "./teamDetailUi";

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
