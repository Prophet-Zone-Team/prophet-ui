"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";

import { getTournamentWinner, hasTournamentWinner } from "@/data/strategy";
import {
  useWinnerSnapshots,
  useWinnerTeamsStatus,
  useWinnerTeamsStore
} from "@/store/winner-teams-store";
import { isWinnerTeamsLoading } from "@/views/home/hooks/use-teams";
import {
  StrategyCard,
  StrategyCardBodySections
} from "@/views/strategy/components/card";

import { useLocalizedStrategyLabels } from "@/hooks/i18n/use-localized-strategy-labels";

import {
  buildEndedStrategyCards,
  type EndedStrategyCardData
} from "./lib/map-strategy-data";

export function StrategyEnded() {
  const t = useTranslations("strategy");
  const fetchEvent = useWinnerTeamsStore((state) => state.fetchEvent);
  const snapshots = useWinnerSnapshots();
  const status = useWinnerTeamsStatus();
  const isLoading = isWinnerTeamsLoading(status);
  const tournamentWinner = getTournamentWinner();

  useEffect(() => {
    void fetchEvent();
  }, [fetchEvent]);

  const endedStrategies = useMemo(() => {
    if (!tournamentWinner) {
      return [];
    }

    return buildEndedStrategyCards(snapshots, tournamentWinner);
  }, [snapshots, tournamentWinner]);

  if (!hasTournamentWinner() || endedStrategies.length === 0) {
    return (
      <section aria-label={t("endedStrategies")}>
        <p className="py-8 text-center text-sm text-prophet-muted md:py-12">
          {t("noEndedStrategies")}
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label={t("endedStrategies")}
      className="flex flex-col gap-3 md:gap-4"
    >
      {endedStrategies.map((strategy) => (
        <StrategyEndedCard
          key={strategy.id}
          strategy={strategy}
          isLoading={isLoading}
        />
      ))}
    </section>
  );
}

function StrategyEndedCard({
  strategy,
  isLoading
}: {
  strategy: EndedStrategyCardData;
  isLoading: boolean;
}) {
  const { name, description } = useLocalizedStrategyLabels(strategy.id, {
    name: strategy.name,
    description: strategy.description
  });

  return (
    <StrategyCard variant={strategy.variant} title={name}>
      <StrategyCardBodySections
        variant={strategy.variant}
        winnerTeam={strategy.winnerTeam}
        description={description}
        budgetLabel={strategy.budgetLabel}
        estimatedRoiLabel={strategy.estimatedRoiLabel}
        hitReturnLabel={strategy.hitReturnLabel}
        isLoading={isLoading}
        teams={strategy.teamRefs}
        legs={strategy.legs}
      />
    </StrategyCard>
  );
}
