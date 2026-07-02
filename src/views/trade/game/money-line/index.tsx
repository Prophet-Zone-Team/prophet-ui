"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { resolveMatchSides } from "@/lib/market/schedule-match";
import {
  mergeLivePricesIntoGameOutcomes,
  resolveFixtureOutcomeDisplayProbability,
} from "@/lib/market/merge-live-outcome-prices";
import type {
  FixtureMarketOutcome,
  GameFixtureMarketsSnapshot,
  GameMarketSnapshot,
  TeamMarketSnapshot,
  WorldCupMatch,
} from "@/types/market";
import {
  buildBinarySummaryFromOutcomes,
  buildTernarySummaryFromOutcomes,
  GameProbabilitySection,
  type ProbabilitySummaryItem,
} from "@/views/trade/game-probability/section";
import type { MarketOtherSourceItem } from "@/views/trade/game/markets/market-other-sources";
import { MarketOtherSources } from "@/views/trade/game/markets/market-other-sources";
import { MoneyLineCardActions } from "./card-actions";
import { MoneyLineCardPosition } from "./money-line-card-position";
import { CollapsedHeader } from "./collapsed-header";
import { MoneyLineCard } from "./money-line-card";
import {
  resolveDefaultOutcomeForCard,
  resolveMoneyLineCards,
} from "./resolve-money-line-cards";
import { resolvePositionsForCard } from "./resolve-card-positions";
import { useMoneyLinePositions } from "./use-money-line-positions";
import type { MoneyLineCardDefinition, MoneyLineCardId } from "./types";

function mergeLiveOutcomesForCard(
  outcomes: FixtureMarketOutcome[],
  liveOutcomes: FixtureMarketOutcome[],
): FixtureMarketOutcome[] {
  if (!liveOutcomes.length) {
    return outcomes;
  }

  const pricesById = new Map(liveOutcomes.map((item) => [item.id, item]));
  return outcomes.map(
    (outcome) => pricesById.get(outcome.id) ?? outcome,
  );
}

function buildYesNoSummary(
  outcome: FixtureMarketOutcome | undefined,
  yesLabel: string,
  noLabel: string,
): ProbabilitySummaryItem[] {
  if (!outcome) {
    return [];
  }

  const yesValue = resolveFixtureOutcomeDisplayProbability(outcome);
  const noValue =
    outcome.noAsk !== undefined
      ? outcome.noAsk * 100
      : Math.max(0, 100 - yesValue);

  return [
    {
      label: yesLabel,
      value: yesValue,
      color: "#65AF14",
    },
    {
      label: noLabel,
      value: noValue,
      color: "#FF674B",
    },
  ];
}

function buildCardSummaryConfig({
  card,
  liveOutcomes,
  liveGameOutcomes,
  homeLabel,
  awayLabel,
  drawLabel,
  homeCode,
  awayCode,
  yesLabel,
  noLabel,
}: {
  card: MoneyLineCardDefinition;
  liveOutcomes: FixtureMarketOutcome[];
  liveGameOutcomes: ReturnType<typeof mergeLivePricesIntoGameOutcomes>;
  homeLabel: string;
  awayLabel: string;
  drawLabel: string;
  homeCode?: string;
  awayCode?: string;
  yesLabel: string;
  noLabel: string;
}) {
  if (card.id === "moneyline") {
    return {
      summaryMode: "ternary" as const,
      summaryItems: buildTernarySummaryFromOutcomes(
        liveGameOutcomes,
        homeLabel,
        awayLabel,
        drawLabel,
        homeCode,
        awayCode,
      ),
    };
  }

  if (card.id === "team_to_advance") {
    return {
      summaryMode: "binary" as const,
      summaryItems: buildBinarySummaryFromOutcomes(
        liveOutcomes,
        "home",
        "away",
        liveOutcomes.find((item) => item.side === "home")?.label ?? homeLabel,
        liveOutcomes.find((item) => item.side === "away")?.label ?? awayLabel,
        homeCode,
        awayCode,
      ),
      binaryPrimaryLabel:
        liveOutcomes.find((item) => item.side === "home")?.label ?? homeLabel,
      binarySecondaryLabel:
        liveOutcomes.find((item) => item.side === "away")?.label ?? awayLabel,
    };
  }

  const outcome = liveOutcomes[0];

  return {
    summaryMode: "binary" as const,
    summaryItems: buildYesNoSummary(outcome, yesLabel, noLabel),
    binaryPrimaryLabel: yesLabel,
    binarySecondaryLabel: noLabel,
  };
}

export interface MoneyLineSectionProps {
  match: WorldCupMatch;
  gameSnapshot: GameMarketSnapshot;
  fixtureMarkets: GameFixtureMarketsSnapshot;
  teamSnapshots: TeamMarketSnapshot[];
  liveOutcomes: FixtureMarketOutcome[];
  liveGameOutcomes: ReturnType<typeof mergeLivePricesIntoGameOutcomes>;
  showOrderbook: boolean;
  selectedOutcomeId?: string;
  selectedBinarySide?: "yes" | "no";
  otherSources?: MarketOtherSourceItem[];
  onSelect: (outcome: FixtureMarketOutcome, binarySide?: "yes" | "no") => void;
}

function resolveCardOtherSources(
  cardOutcomes: FixtureMarketOutcome[],
  selectedOutcomeId: string | undefined,
  otherSources: MarketOtherSourceItem[] | undefined,
): MarketOtherSourceItem[] {
  if (!otherSources?.length || !selectedOutcomeId) {
    return [];
  }

  const selectedInCard = cardOutcomes.some(
    (outcome) => outcome.id === selectedOutcomeId,
  );

  return selectedInCard ? otherSources : [];
}

export function MoneyLineSection({
  match,
  gameSnapshot,
  fixtureMarkets,
  teamSnapshots,
  liveOutcomes,
  liveGameOutcomes,
  showOrderbook,
  selectedOutcomeId,
  selectedBinarySide,
  otherSources,
  onSelect,
}: MoneyLineSectionProps) {
  const t = useTranslations("trade");
  const cards = useMemo(
    () => resolveMoneyLineCards(fixtureMarkets),
    [fixtureMarkets],
  );
  const { positions: allPositions, reload: reloadPositions } =
    useMoneyLinePositions(cards);
  const [expandedCardId, setExpandedCardId] = useState<MoneyLineCardId | null>(
    null,
  );

  const sides = useMemo(
    () => resolveMatchSides(match, teamSnapshots),
    [match, teamSnapshots],
  );

  useEffect(() => {
    if (cards.length === 0) {
      setExpandedCardId(null);
      return;
    }

    if (
      expandedCardId !== null &&
      !cards.some((card) => card.id === expandedCardId)
    ) {
      setExpandedCardId(null);
    }
  }, [cards, expandedCardId]);

  const handleToggle = (cardId: MoneyLineCardId) => {
    setExpandedCardId((current) => {
      const next = current === cardId ? null : cardId;

      if (next) {
        const card = cards.find((item) => item.id === next);

        if (card) {
          const defaultOutcome = resolveDefaultOutcomeForCard(card);

          if (defaultOutcome) {
            onSelect(defaultOutcome, "yes");
          }
        }
      }

      return next;
    });
  };

  if (!cards.length) {
    return null;
  }

  return (
    <div className="flex flex-col gap-[5px]">
      {cards.map((card) => {
        const cardOutcomes = mergeLiveOutcomesForCard(
          card.group.outcomes,
          liveOutcomes,
        );
        const expanded = expandedCardId === card.id;
        const summaryConfig = buildCardSummaryConfig({
          card,
          liveOutcomes: cardOutcomes,
          liveGameOutcomes,
          homeLabel: sides.home.name ?? t("home"),
          awayLabel: sides.away.name ?? t("away"),
          drawLabel: t("draw"),
          homeCode: sides.home.code,
          awayCode: sides.away.code,
          yesLabel: t("yes"),
          noLabel: t("no"),
        });
        const cardPositions = resolvePositionsForCard(card, allPositions);

        const cardOtherSources = resolveCardOtherSources(
          cardOutcomes,
          selectedOutcomeId,
          otherSources,
        );

        return (
          <MoneyLineCard
            key={card.id}
            expanded={expanded}
            header={
              <CollapsedHeader
                title={t(card.titleKey)}
                cardId={card.id}
                volume={card.group.volume}
                expanded={expanded}
                onToggle={() => handleToggle(card.id)}
                actions={
                  <MoneyLineCardActions
                    cardId={card.id}
                    outcomes={cardOutcomes}
                    selectedOutcomeId={selectedOutcomeId}
                    selectedBinarySide={selectedBinarySide}
                    onSelect={onSelect}
                  />
                }
              />
            }
            position={
              cardPositions.length > 0 ? (
                <MoneyLineCardPosition
                  positions={cardPositions}
                  cardOutcomes={cardOutcomes}
                  gameSnapshot={gameSnapshot}
                  fixtureMarkets={fixtureMarkets}
                  onPositionsChange={() => void reloadPositions()}
                />
              ) : undefined
            }
            expandedContent={
              <GameProbabilitySection
                match={match}
                snapshots={teamSnapshots}
                gameSnapshot={gameSnapshot}
                fixtureMarkets={fixtureMarkets}
                showOrderbook={showOrderbook}
                variant="embedded"
                chartKind={card.chartKind}
                summaryMode={summaryConfig.summaryMode}
                summaryItems={summaryConfig.summaryItems}
                binaryPrimaryLabel={summaryConfig.binaryPrimaryLabel}
                binarySecondaryLabel={summaryConfig.binarySecondaryLabel}
              />
            }
            footer={
              <MarketOtherSources
                sources={cardOtherSources}
                className="border-t border-[#EBEBEB] p-3 md:p-[16px]"
              />
            }
          />
        );
      })}
    </div>
  );
}
