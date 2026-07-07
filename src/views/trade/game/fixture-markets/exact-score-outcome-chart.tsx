"use client";

import type {
  FixtureMarketOutcome,
  GameFixtureMarketsSnapshot,
  GameMarketSnapshot,
  TeamMarketSnapshot,
  WorldCupMatch
} from "@/types/market";
import {
  buildExactScoreBinarySummary,
  GameProbabilitySection
} from "@/views/trade/game-probability/section";

export function ExactScoreOutcomeChart({
  match,
  gameSnapshot,
  fixtureMarkets,
  teamSnapshots,
  outcome,
  showOrderbook
}: {
  match: WorldCupMatch;
  gameSnapshot: GameMarketSnapshot;
  fixtureMarkets: GameFixtureMarketsSnapshot;
  teamSnapshots: TeamMarketSnapshot[];
  outcome: FixtureMarketOutcome;
  showOrderbook: boolean;
}) {
  return (
    <GameProbabilitySection
      match={match}
      snapshots={teamSnapshots}
      gameSnapshot={gameSnapshot}
      fixtureMarkets={fixtureMarkets}
      showOrderbook={showOrderbook}
      chartKind="exact_score"
      lineKey={outcome.id}
      summaryMode="binary"
      summaryItems={buildExactScoreBinarySummary(outcome)}
      binaryPrimaryLabel="Yes"
      binarySecondaryLabel="No"
      className="min-w-0 border-t border-prophet-line bg-prophet-panel p-3 md:p-[16px]"
    />
  );
}
