"use client";

import { useTranslations } from "next-intl";
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

import { useLocalizedStrategyLabels } from "@/hooks/i18n/use-localized-strategy-labels";

import {
  buildAvailableStrategyCards,
  type AvailableStrategyCardData
} from "./lib/map-strategy-data";

export function StrategyAvailable() {
  const t = useTranslations("strategy");
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
      <section aria-label={t("availableStrategies")}>
        <p className="py-8 text-center text-sm text-[#909090] md:py-12">
          {t("noAvailableStrategies")}
        </p>
      </section>
    );
  }

  return (
    <>
      <section
        aria-label={t("availableStrategies")}
        className="flex flex-col gap-3 md:gap-4"
      >
        {availableStrategies.map((strategy) => (
          <StrategyAvailableCard
            key={strategy.id}
            strategy={strategy}
            isLoading={isLoading}
            onPlaceBid={() => setBidStrategy(strategy)}
          />
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

function StrategyAvailableCard({
  strategy,
  isLoading,
  onPlaceBid
}: {
  strategy: AvailableStrategyCardData;
  isLoading: boolean;
  onPlaceBid: () => void;
}) {
  const { name, description } = useLocalizedStrategyLabels(strategy.id, {
    name: strategy.name,
    description: strategy.description
  });

  return (
    <StrategyCard variant="available" title={name}>
      <StrategyCardBodySections
        description={description}
        badge={strategy.badge}
        budgetLabel={strategy.budgetLabel}
        estimatedRoiLabel={strategy.estimatedRoiLabel}
        hitReturnLabel={strategy.hitReturnLabel}
        isLoading={isLoading}
        teams={strategy.teamRefs}
        legs={strategy.legs}
        onPlaceBid={onPlaceBid}
      />
    </StrategyCard>
  );
}
