"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { buildEsportsGroupChartLineKey } from "@/lib/market/fixture-chart-tokens";
import { resolveMatchSides } from "@/lib/market/schedule-match";
import type {
  EsportsDisplayGroup,
  FixtureMarketOutcome,
  GameFixtureMarketsSnapshot,
  GameMarketSnapshot,
  TeamMarketSnapshot,
  WorldCupMatch,
} from "@/types/market";
import {
  buildBinarySummaryFromOutcomes,
  buildExactScoreBinarySummary,
  GameProbabilitySection,
} from "@/views/trade/game-probability/section";

function mergeLiveOutcomes(
  outcomes: FixtureMarketOutcome[],
  liveOutcomes: FixtureMarketOutcome[],
): FixtureMarketOutcome[] {
  const pricesById = new Map(liveOutcomes.map((outcome) => [outcome.id, outcome]));
  return outcomes.map((outcome) => pricesById.get(outcome.id) ?? outcome);
}

export function EsportsGroupChart({
  match,
  gameSnapshot,
  fixtureMarkets,
  teamSnapshots,
  group,
  lineKey,
  liveOutcomes,
  showOrderbook,
  homeLabel,
  awayLabel,
}: {
  match: WorldCupMatch;
  gameSnapshot: GameMarketSnapshot;
  fixtureMarkets: GameFixtureMarketsSnapshot;
  teamSnapshots: TeamMarketSnapshot[];
  group: EsportsDisplayGroup;
  lineKey: string;
  liveOutcomes: FixtureMarketOutcome[];
  showOrderbook: boolean;
  homeLabel: string;
  awayLabel: string;
}) {
  const t = useTranslations("trade");
  const activeOutcomes = useMemo(
    () => mergeLiveOutcomes(group.outcomesByLine[lineKey] ?? [], liveOutcomes),
    [group.outcomesByLine, lineKey, liveOutcomes],
  );

  const summaryConfig = useMemo(() => {
    if (group.buttonMode === "yes_no") {
      const outcome = activeOutcomes[0];

      return {
        summaryMode: "binary" as const,
        summaryItems: outcome ? buildExactScoreBinarySummary(outcome) : [],
        binaryPrimaryLabel: t("yes"),
        binarySecondaryLabel: t("no"),
      };
    }

    if (group.buttonMode === "over_under") {
      return {
        summaryMode: "binary" as const,
        summaryItems: buildBinarySummaryFromOutcomes(
          activeOutcomes,
          "over",
          "under",
          t("over"),
          t("under"),
        ),
        binaryPrimaryLabel: t("over"),
        binarySecondaryLabel: t("under"),
      };
    }

    const sides = resolveMatchSides(match, teamSnapshots);

    return {
      summaryMode: "binary" as const,
      summaryItems: buildBinarySummaryFromOutcomes(
        activeOutcomes,
        "home",
        "away",
        homeLabel,
        awayLabel,
        sides.home.code,
        sides.away.code,
      ),
      binaryPrimaryLabel: homeLabel,
      binarySecondaryLabel: awayLabel,
    };
  }, [
    activeOutcomes,
    awayLabel,
    group.buttonMode,
    homeLabel,
    match,
    t,
    teamSnapshots,
  ]);

  return (
    <GameProbabilitySection
      match={match}
      snapshots={teamSnapshots}
      gameSnapshot={gameSnapshot}
      fixtureMarkets={fixtureMarkets}
      showOrderbook={showOrderbook}
      variant="embedded"
      chartKind="esports_group"
      lineKey={buildEsportsGroupChartLineKey(group.id, lineKey)}
      summaryMode={summaryConfig.summaryMode}
      summaryItems={summaryConfig.summaryItems}
      binaryPrimaryLabel={summaryConfig.binaryPrimaryLabel}
      binarySecondaryLabel={summaryConfig.binarySecondaryLabel}
    />
  );
}
