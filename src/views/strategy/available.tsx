"use client";

import { useEffect, useMemo, useState } from "react";

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
import { StrategyBidModal } from "@/views/strategy/components/bid-modal";

import {
  buildAvailableStrategyCards,
  type AvailableStrategyCardData
} from "./lib/map-strategy-data";

export function StrategyAvailable() {
  const fetchEvent = useWinnerTeamsStore((state) => state.fetchEvent);
  const snapshots = useWinnerSnapshots();
  const status = useWinnerTeamsStatus();
  const isLoading = isWinnerTeamsLoading(status);
  const [bidStrategy, setBidStrategy] =
    useState<AvailableStrategyCardData | null>(null);

  useEffect(() => {
    void fetchEvent();
  }, [fetchEvent]);

  const availableStrategies = useMemo(
    () => buildAvailableStrategyCards(snapshots),
    [snapshots]
  );

  if (availableStrategies.length === 0) {
    return (
      <section aria-label="Available strategies">
        <p className="py-8 text-center text-sm text-[#909090] md:py-12">
          No available strategies at the moment.
        </p>
      </section>
    );
  }

  return (
    <>
      <section
        aria-label="Available strategies"
        className="flex flex-col gap-3 md:gap-4"
      >
        {availableStrategies.map((strategy) => (
          <StrategyCard
            key={strategy.id}
            variant="available"
            title={strategy.name}
          >
            <StrategyCardBodySections
              description={strategy.description}
              badge={strategy.badge}
              budgetLabel={strategy.budgetLabel}
              estimatedRoiLabel={strategy.estimatedRoiLabel}
              hitReturnLabel={strategy.hitReturnLabel}
              isLoading={isLoading}
              teams={strategy.teamRefs}
              legs={strategy.legs}
              onPlaceBid={() => setBidStrategy(strategy)}
            />
          </StrategyCard>
        ))}
      </section>

      <StrategyBidModal
        open={bidStrategy !== null}
        onClose={() => setBidStrategy(null)}
        strategy={bidStrategy}
        snapshots={snapshots}
      />
    </>
  );
}
