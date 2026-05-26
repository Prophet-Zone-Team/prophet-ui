"use client";

import { useEffect, useState } from "react";

import { TabSwitcher } from "@/components/ui/tab-switcher";
import { resolveDefaultFixtureOutcome } from "@/lib/market/fixture-markets-mapper";
import {
  useSelectFixtureOutcome,
  useSelectedFixtureOutcome,
  useTradeOutcomeSide
} from "@/store/trade-ticket-store";
import type {
  FixtureMarketOutcome,
  GameFixtureMarketsSnapshot,
  GameMarketSnapshot,
  TeamMarketSnapshot
} from "@/types/market";
import { ExactScorePanel } from "@/views/trade/game/fixture-markets/exact-score-panel";
import { GameLinesPanel } from "@/views/trade/game/fixture-markets/game-lines-panel";
import { HalftimePanel } from "@/views/trade/game/fixture-markets/halftime-panel";

const FIXTURE_TABS = [
  { id: "lines", label: "Game Lines" },
  { id: "exact_score", label: "Exact Score" },
  { id: "halftime", label: "Half-time" }
] as const;

type FixtureTabId = (typeof FIXTURE_TABS)[number]["id"];

export interface GameFixtureMarketsSectionProps {
  fixtureMarkets: GameFixtureMarketsSnapshot;
  gameSnapshot: GameMarketSnapshot;
  teamSnapshots: TeamMarketSnapshot[];
}

export function GameFixtureMarketsSection({
  fixtureMarkets,
  gameSnapshot
}: GameFixtureMarketsSectionProps) {
  const [tab, setTab] = useState<FixtureTabId>("lines");
  const selectedOutcome = useSelectedFixtureOutcome();
  const selectedBinarySide = useTradeOutcomeSide();
  const selectFixtureOutcome = useSelectFixtureOutcome();

  useEffect(() => {
    if (selectedOutcome) {
      return;
    }

    const defaultOutcome =
      resolveDefaultFixtureOutcome(
        gameSnapshot.match.polymarket?.fixtureMarkets
      ) ??
      resolveDefaultFixtureOutcome({
        lines: fixtureMarkets.lines,
        exactScores: fixtureMarkets.exactScores,
        halftime: fixtureMarkets.halftime
      });

    if (defaultOutcome) {
      selectFixtureOutcome(defaultOutcome, "yes");
    }
  }, [
    fixtureMarkets,
    gameSnapshot.match.polymarket?.fixtureMarkets,
    selectFixtureOutcome,
    selectedOutcome
  ]);

  const handleSelect = (
    outcome: FixtureMarketOutcome,
    binarySide: "yes" | "no" = "yes"
  ) => {
    selectFixtureOutcome(outcome, binarySide);
  };

  return (
    <section
      className="mt-6 flex flex-col gap-[5px]"
      aria-label="Match markets"
    >
      <TabSwitcher
        items={[...FIXTURE_TABS]}
        value={tab}
        onChange={(value) => setTab(value as FixtureTabId)}
        aria-label="Match market categories"
      />

      {tab === "lines" ? (
        <GameLinesPanel
          groups={fixtureMarkets.lines}
          selectedOutcomeId={selectedOutcome?.id}
          selectedBinarySide={selectedBinarySide}
          onSelect={handleSelect}
        />
      ) : null}

      {tab === "exact_score" ? (
        <ExactScorePanel
          outcomes={fixtureMarkets.exactScores}
          selectedOutcomeId={selectedOutcome?.id}
          selectedBinarySide={selectedBinarySide}
          onSelect={handleSelect}
        />
      ) : null}

      {tab === "halftime" ? (
        <HalftimePanel
          outcomes={fixtureMarkets.halftime}
          selectedOutcomeId={selectedOutcome?.id}
          selectedBinarySide={selectedBinarySide}
          onSelect={handleSelect}
        />
      ) : null}
    </section>
  );
}
