"use client";

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

import { buildEndedStrategyCards } from "./lib/map-strategy-data";

export function StrategyEnded() {
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
      <section aria-label="Ended strategies">
        <p className="py-8 text-center text-sm text-[#909090] md:py-12">
          No ended strategies yet.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Ended strategies"
      className="flex flex-col gap-3 md:gap-4"
    >
      {endedStrategies.map((strategy) => (
        <StrategyCard
          key={strategy.id}
          variant={strategy.variant}
          title={strategy.name}
        >
          <StrategyCardBodySections
            variant={strategy.variant}
            winnerTeam={strategy.winnerTeam}
            description={strategy.description}
            budgetLabel={strategy.budgetLabel}
            estimatedRoiLabel={strategy.estimatedRoiLabel}
            hitReturnLabel={strategy.hitReturnLabel}
            isLoading={isLoading}
            teams={strategy.teamRefs}
            legs={strategy.legs}
          />
        </StrategyCard>
      ))}
    </section>
  );
}
