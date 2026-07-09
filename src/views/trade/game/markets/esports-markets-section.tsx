"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { OrderbookToggle } from "@/components/ui/orderbook-toggle";
import { resolveFixtureBuyAsk } from "@/lib/market/fixture-ask-liquidity";
import { mergeLivePricesIntoFixtureOutcomes } from "@/lib/market/merge-live-outcome-prices";
import { isGameMarketWsEnabled } from "@/lib/market/live-match";
import { resolveDefaultEsportsOutcome } from "@/lib/market/map-prophet-esports-markets";
import { resolveAllFixtureOutcomes } from "@/lib/market/fixture-tab-outcomes";
import { resolveMatchSides } from "@/lib/market/schedule-match";
import { useMatchWithLiveState } from "@/store/match-live-store";
import {
  useSelectFixtureOutcome,
  useSelectedFixtureOutcome,
  useTradeOutcomeSide,
} from "@/store/trade-ticket-store";
import {
  useSetShowOrderbook,
  useShowOrderbook,
} from "@/store/user-config-store";
import type {
  EsportsDisplayGroup,
  EsportsMarketSection,
  FixtureMarketOutcome,
  GameFixtureMarketsSnapshot,
  GameMarketSnapshot,
  TeamMarketSnapshot,
  WorldCupMatch,
} from "@/types/market";
import { LineOutcomeButton } from "@/views/trade/game/fixture-markets/line-outcome-button";
import { LineSelector } from "@/views/trade/game/fixture-markets/line-selector";
import { EsportsGroupChart } from "@/views/trade/game/markets/esports-group-chart";
import { EsportsMarketGroupCard } from "@/views/trade/game/markets/esports-market-group-card";
import {
  isOutcomeBuyable,
  isOutcomeSelected,
  resolveOutcomeDisplayPrice,
} from "@/views/trade/game/markets/fixture-market-actions";
import { OutcomeButtons } from "@/views/trade/game/markets/market-action-row";
import { useGameMarketWsTokens } from "@/views/trade/game/markets/use-game-market-ws-tokens";
import { useLiveFixtureTabPrices } from "@/views/trade/game/markets/use-live-fixture-tab-prices";

export interface EsportsMarketsSectionProps {
  match: WorldCupMatch;
  gameSnapshot: GameMarketSnapshot;
  fixtureMarkets: GameFixtureMarketsSnapshot;
  teamSnapshots: TeamMarketSnapshot[];
}

function resolveGroupTitle(
  t: ReturnType<typeof useTranslations<"trade">>,
  group: EsportsDisplayGroup,
): string {
  if (group.titleKey) {
    return t(group.titleKey);
  }

  return group.title;
}

function resolveSectionTitle(
  t: ReturnType<typeof useTranslations<"trade">>,
  section: EsportsMarketSection,
): string {
  if (section.titleKey === "esportsGameSection" && section.gameNumber) {
    return t("esportsGameSection", { number: section.gameNumber });
  }

  return t(section.titleKey);
}

function resolveDefaultOutcomeForGroup(
  group: EsportsDisplayGroup,
  lineKey: string,
): FixtureMarketOutcome | undefined {
  const outcomes = group.outcomesByLine[lineKey] ?? [];

  if (group.buttonMode === "over_under") {
    return outcomes.find((outcome) => outcome.side === "over") ?? outcomes[0];
  }

  if (group.buttonMode === "home_away") {
    return outcomes.find((outcome) => outcome.side === "home") ?? outcomes[0];
  }

  return outcomes[0];
}

function outcomeBelongsToGroup(
  outcome: FixtureMarketOutcome,
  group: EsportsDisplayGroup,
  lineKey: string,
): boolean {
  return (group.outcomesByLine[lineKey] ?? []).some((entry) => entry.id === outcome.id);
}

function EsportsYesNoActions({
  group,
  lineKey,
  liveOutcomes,
  selectedOutcomeId,
  selectedBinarySide,
  onSelect,
  t,
}: {
  group: EsportsDisplayGroup;
  lineKey: string;
  liveOutcomes: FixtureMarketOutcome[];
  selectedOutcomeId?: string;
  selectedBinarySide?: "yes" | "no";
  onSelect: (outcome: FixtureMarketOutcome, binarySide?: "yes" | "no") => void;
  t: ReturnType<typeof useTranslations<"trade">>;
}) {
  const pricesById = new Map(liveOutcomes.map((outcome) => [outcome.id, outcome]));
  const outcome = (group.outcomesByLine[lineKey] ?? [])
    .map((entry) => pricesById.get(entry.id) ?? entry)[0];

  if (!outcome) {
    return null;
  }

  return (
    <>
      {(["yes", "no"] as const).map((binarySide) => {
        const buyable = isOutcomeBuyable(outcome, binarySide);

        return (
          <LineOutcomeButton
            key={binarySide}
            label={binarySide === "yes" ? t("yes") : t("no")}
            price={
              buyable
                ? resolveOutcomeDisplayPrice(outcome, binarySide)
                : undefined
            }
            variant={binarySide}
            active={isOutcomeSelected(
              outcome,
              binarySide,
              selectedOutcomeId,
              selectedBinarySide,
            )}
            disabled={!buyable}
            onClick={
              buyable ? () => onSelect(outcome, binarySide) : undefined
            }
          />
        );
      })}
    </>
  );
}

function EsportsLineGroupActions({
  group,
  selectedLineKey,
  liveOutcomes,
  selectedOutcomeId,
  selectedBinarySide,
  onSelect,
}: {
  group: EsportsDisplayGroup;
  selectedLineKey: string;
  liveOutcomes: FixtureMarketOutcome[];
  selectedOutcomeId?: string;
  selectedBinarySide?: "yes" | "no";
  onSelect: (outcome: FixtureMarketOutcome, binarySide?: "yes" | "no") => void;
}) {
  const pricesById = new Map(liveOutcomes.map((outcome) => [outcome.id, outcome]));
  const visibleOutcomes = (group.outcomesByLine[selectedLineKey] ?? []).map(
    (outcome) => pricesById.get(outcome.id) ?? outcome,
  );
  const groupType = group.buttonMode === "over_under" ? "total" : undefined;

  return (
    <OutcomeButtons
      outcomes={visibleOutcomes}
      groupType={groupType}
      selectedOutcomeId={selectedOutcomeId}
      selectedBinarySide={selectedBinarySide}
      onSelect={onSelect}
    />
  );
}

export function EsportsMarketsSection({
  match,
  gameSnapshot,
  fixtureMarkets,
  teamSnapshots,
}: EsportsMarketsSectionProps) {
  const t = useTranslations("trade");
  const selectedOutcome = useSelectedFixtureOutcome();
  const selectedBinarySide = useTradeOutcomeSide();
  const selectFixtureOutcome = useSelectFixtureOutcome();
  const showOrderbook = useShowOrderbook();
  const setShowOrderbook = useSetShowOrderbook();
  const liveMatch = useMatchWithLiveState(match);
  const marketWsEnabled = isGameMarketWsEnabled(liveMatch);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  const sides = useMemo(
    () => resolveMatchSides(liveMatch, teamSnapshots),
    [liveMatch, teamSnapshots],
  );

  const esportsSections = useMemo(
    () => fixtureMarkets.esportsSections ?? [],
    [fixtureMarkets.esportsSections],
  );
  const esportsMarkets = useMemo(
    () => fixtureMarkets.esportsMarkets ?? [],
    [fixtureMarkets.esportsMarkets],
  );
  const allFixtureOutcomes = useMemo(
    () => resolveAllFixtureOutcomes(fixtureMarkets),
    [fixtureMarkets],
  );

  const initialLineKeys = useMemo(() => {
    const keys: Record<string, string> = {};

    for (const section of esportsSections) {
      for (const group of section.groups) {
        keys[group.id] = group.defaultLineKey ?? group.lineOptions[0]?.key ?? "_default";
      }
    }

    return keys;
  }, [esportsSections]);

  const [lineKeysByGroup, setLineKeysByGroup] =
    useState<Record<string, string>>(initialLineKeys);

  useEffect(() => {
    setLineKeysByGroup(initialLineKeys);
  }, [initialLineKeys]);

  useEffect(() => {
    if (
      expandedGroupId !== null &&
      !esportsSections.some((section) =>
        section.groups.some((group) => group.id === expandedGroupId),
      )
    ) {
      setExpandedGroupId(null);
    }
  }, [esportsSections, expandedGroupId]);

  useGameMarketWsTokens({
    fixtureOutcomes: allFixtureOutcomes,
    gameSnapshot,
    enabled: marketWsEnabled,
  });

  const { pricesByOutcomeId, revision: marketWsRevision } = useLiveFixtureTabPrices({
    outcomes: allFixtureOutcomes,
    enabled: marketWsEnabled,
  });

  const liveOutcomes = useMemo(
    () => mergeLivePricesIntoFixtureOutcomes(allFixtureOutcomes, pricesByOutcomeId),
    [allFixtureOutcomes, pricesByOutcomeId, marketWsRevision],
  );

  const selectDefaultOutcome = useCallback(() => {
    const defaultOutcome = resolveDefaultEsportsOutcome(
      esportsSections,
      esportsMarkets,
    );

    if (defaultOutcome) {
      selectFixtureOutcome(defaultOutcome, "yes");
    }
  }, [esportsMarkets, esportsSections, selectFixtureOutcome]);

  useEffect(() => {
    if (!selectedOutcome) {
      selectDefaultOutcome();
    }
  }, [selectDefaultOutcome, selectedOutcome]);

  const handleSelect = (
    outcome: FixtureMarketOutcome,
    binarySide: "yes" | "no" = "yes",
  ) => {
    if (
      outcome.marketType !== "esports_prop" &&
      !resolveFixtureBuyAsk(outcome, binarySide === "no" ? "no" : "yes")
    ) {
      return;
    }

    selectFixtureOutcome(outcome, binarySide);
  };

  const handleLineChange = (group: EsportsDisplayGroup, lineKey: string) => {
    setLineKeysByGroup((current) => ({
      ...current,
      [group.id]: lineKey,
    }));

    if (
      selectedOutcome &&
      !outcomeBelongsToGroup(selectedOutcome, group, lineKey)
    ) {
      const defaultOutcome = resolveDefaultOutcomeForGroup(group, lineKey);

      if (defaultOutcome) {
        selectFixtureOutcome(defaultOutcome, "yes");
      }
    }
  };

  const handleToggleGroup = (group: EsportsDisplayGroup, lineKey: string) => {
    setExpandedGroupId((current) => {
      const next = current === group.id ? null : group.id;

      if (next) {
        const defaultOutcome = resolveDefaultOutcomeForGroup(group, lineKey);

        if (defaultOutcome) {
          selectFixtureOutcome(defaultOutcome, "yes");
        }
      }

      return next;
    });
  };

  if (!esportsSections.length) {
    return (
      <section className="md:mt-[50px] mt-[20px] flex flex-col gap-[5px] px-3 md:px-0">
        <div className="rounded-[12px] border border-dashed border-prophet-line px-4 py-10 text-center">
          <p className="m-0 text-sm font-[400] leading-[17px] text-[#909090]">
            {t("unableToLoadData")}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="md:mt-[50px] mt-[20px] flex flex-col gap-[5px]"
      aria-label={t("matchMarkets")}
    >
      <div className="flex min-w-0 items-center justify-end gap-4 px-3 md:px-0">
        <OrderbookToggle
          variant="game"
          checked={showOrderbook}
          onChange={setShowOrderbook}
          className="hidden shrink-0 md:flex"
        />
      </div>

      <div className="flex flex-col gap-6 px-3 md:px-0">
        {esportsSections.map((section) => (
          <div key={section.id} className="flex flex-col gap-[5px]">
            <h2 className="m-0 px-1 text-[18px] font-[500] leading-[23px] text-prophet-foreground">
              {resolveSectionTitle(t, section)}
            </h2>

            <div className="flex flex-col gap-[5px]">
              {section.groups.map((group) => {
                const lineKey =
                  lineKeysByGroup[group.id] ??
                  group.defaultLineKey ??
                  group.lineOptions[0]?.key ??
                  "_default";
                const expanded = expandedGroupId === group.id;
                const hasLineSelector = group.lineOptions.length > 1;

                return (
                  <EsportsMarketGroupCard
                    key={group.id}
                    title={resolveGroupTitle(t, group)}
                    volume={group.volume}
                    expanded={expanded}
                    onToggle={() => handleToggleGroup(group, lineKey)}
                    lineSelector={
                      hasLineSelector ? (
                        <LineSelector
                          options={group.lineOptions}
                          value={lineKey}
                          onChange={(nextLineKey) =>
                            handleLineChange(group, nextLineKey)
                          }
                          variant="pill"
                        />
                      ) : undefined
                    }
                    actions={
                      group.buttonMode === "yes_no" ? (
                        <EsportsYesNoActions
                          group={group}
                          lineKey={lineKey}
                          liveOutcomes={liveOutcomes}
                          selectedOutcomeId={selectedOutcome?.id}
                          selectedBinarySide={selectedBinarySide}
                          onSelect={handleSelect}
                          t={t}
                        />
                      ) : (
                        <EsportsLineGroupActions
                          group={group}
                          selectedLineKey={lineKey}
                          liveOutcomes={liveOutcomes}
                          selectedOutcomeId={selectedOutcome?.id}
                          selectedBinarySide={selectedBinarySide}
                          onSelect={handleSelect}
                        />
                      )
                    }
                    expandedContent={
                      <EsportsGroupChart
                        match={liveMatch}
                        gameSnapshot={gameSnapshot}
                        fixtureMarkets={fixtureMarkets}
                        teamSnapshots={teamSnapshots}
                        group={group}
                        lineKey={lineKey}
                        liveOutcomes={liveOutcomes}
                        showOrderbook={showOrderbook}
                        homeLabel={sides.home.name ?? t("home")}
                        awayLabel={sides.away.name ?? t("away")}
                      />
                    }
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
