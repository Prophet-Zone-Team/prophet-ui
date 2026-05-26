"use client";

import { useMemo, useState } from "react";

import {
  getFixtureLineOptions,
  getFixtureOutcomesForGroup,
  sortFixtureGroupOutcomes
} from "@/lib/market/build-fixture-markets-snapshot";
import { resolveFixtureBuyAsk } from "@/lib/market/fixture-ask-liquidity";
import type { FixtureMarketGroup, FixtureMarketOutcome } from "@/types/market";
import { LineMarketCard } from "@/views/trade/game/fixture-markets/line-market-card";
import {
  LineOutcomeButton,
  type LineOutcomeButtonVariant
} from "@/views/trade/game/fixture-markets/line-outcome-button";
import { LineSelector } from "@/views/trade/game/fixture-markets/line-selector";

type LineSectionType = "moneyline" | "spread" | "total" | "btts";

function findGroupByType(
  groups: FixtureMarketGroup[],
  type: LineSectionType
): FixtureMarketGroup | undefined {
  return groups.find((group) => group.type === type);
}

function resolveOutcomePrice(
  outcome: FixtureMarketOutcome,
  binarySide: "yes" | "no" = "yes"
): number | undefined {
  return resolveFixtureBuyAsk(outcome, binarySide);
}

function isOutcomeBuyable(
  outcome: FixtureMarketOutcome,
  binarySide: "yes" | "no"
): boolean {
  return resolveOutcomePrice(outcome, binarySide) !== undefined;
}

function resolveMoneylineVariant(
  outcome: FixtureMarketOutcome
): LineOutcomeButtonVariant {
  if (outcome.side === "draw") {
    return "draw";
  }

  if (outcome.side === "away") {
    return "away";
  }

  return "home";
}

function resolveSpreadVariant(
  outcome: FixtureMarketOutcome
): LineOutcomeButtonVariant {
  return outcome.side === "away" ? "away" : "home";
}

function resolveTotalVariant(
  outcome: FixtureMarketOutcome
): LineOutcomeButtonVariant {
  return outcome.side === "under" ? "under" : "over";
}

function resolveLineBinarySide(
  outcome: FixtureMarketOutcome,
  groupType: "spread" | "total"
): "yes" | "no" {
  if (groupType === "spread") {
    return outcome.id.endsWith(":no") ? "no" : "yes";
  }

  if (groupType === "total" && outcome.side === "under") {
    return "no";
  }

  return "yes";
}

function isOutcomeSelected(
  outcome: FixtureMarketOutcome,
  binarySide: "yes" | "no",
  selectedOutcomeId?: string,
  selectedBinarySide?: "yes" | "no"
): boolean {
  return (
    selectedOutcomeId === outcome.id &&
    (binarySide === undefined || selectedBinarySide === binarySide)
  );
}

function EmptyActions() {
  return (
    <LineOutcomeButton label="—" variant="draw" disabled />
  );
}

function MoneylineSection({
  group,
  selectedOutcomeId,
  selectedBinarySide,
  onSelect
}: {
  group?: FixtureMarketGroup;
  selectedOutcomeId?: string;
  selectedBinarySide?: "yes" | "no";
  onSelect: (outcome: FixtureMarketOutcome, binarySide?: "yes" | "no") => void;
}) {
  const outcomes = useMemo(
    () => sortFixtureGroupOutcomes(group?.outcomes ?? [], "moneyline"),
    [group?.outcomes]
  );

  return (
    <LineMarketCard
      title="Moneyline"
      volume={group?.volume}
      actions={
        outcomes.length ? (
          outcomes.map((outcome) => {
            const buyable = isOutcomeBuyable(outcome, "yes");

            return (
              <LineOutcomeButton
                key={outcome.id}
                label={outcome.label}
                price={buyable ? resolveOutcomePrice(outcome, "yes") : undefined}
                variant={resolveMoneylineVariant(outcome)}
                active={isOutcomeSelected(
                  outcome,
                  "yes",
                  selectedOutcomeId,
                  selectedBinarySide
                )}
                disabled={!buyable}
                onClick={buyable ? () => onSelect(outcome, "yes") : undefined}
              />
            );
          })
        ) : (
          <EmptyActions />
        )
      }
    />
  );
}

function SpreadTotalSection({
  group,
  sectionTitle,
  groupType,
  selectedOutcomeId,
  selectedBinarySide,
  onSelect
}: {
  group?: FixtureMarketGroup;
  sectionTitle: string;
  groupType: "spread" | "total";
  selectedOutcomeId?: string;
  selectedBinarySide?: "yes" | "no";
  onSelect: (outcome: FixtureMarketOutcome, binarySide?: "yes" | "no") => void;
}) {
  const lineOptions = useMemo(
    () => (group ? getFixtureLineOptions(group) : []),
    [group]
  );
  const [selectedLineKey, setSelectedLineKey] = useState(
    group?.defaultLineKey ?? lineOptions[0]?.key
  );
  const visibleOutcomes = useMemo(() => {
    if (!group) {
      return [];
    }

    return sortFixtureGroupOutcomes(
      getFixtureOutcomesForGroup(group, selectedLineKey),
      groupType
    );
  }, [group, groupType, selectedLineKey]);

  const resolveVariant =
    groupType === "spread" ? resolveSpreadVariant : resolveTotalVariant;

  return (
    <LineMarketCard
      title={sectionTitle}
      volume={group?.volume}
      actions={
        visibleOutcomes.length ? (
          visibleOutcomes.map((outcome) => {
            const binarySide = resolveLineBinarySide(outcome, groupType);
            const buyable = isOutcomeBuyable(outcome, binarySide);

            return (
              <LineOutcomeButton
                key={outcome.id}
                label={outcome.label}
                price={
                  buyable ? resolveOutcomePrice(outcome, binarySide) : undefined
                }
                variant={resolveVariant(outcome)}
                active={isOutcomeSelected(
                  outcome,
                  binarySide,
                  selectedOutcomeId,
                  selectedBinarySide
                )}
                disabled={!buyable}
                onClick={
                  buyable ? () => onSelect(outcome, binarySide) : undefined
                }
              />
            );
          })
        ) : (
          <EmptyActions />
        )
      }
      footer={
        lineOptions.length ? (
          <LineSelector
            options={lineOptions}
            value={selectedLineKey}
            onChange={setSelectedLineKey}
          />
        ) : undefined
      }
    />
  );
}

function BttsSection({
  group,
  selectedOutcomeId,
  selectedBinarySide,
  onSelect
}: {
  group?: FixtureMarketGroup;
  selectedOutcomeId?: string;
  selectedBinarySide?: "yes" | "no";
  onSelect: (outcome: FixtureMarketOutcome, binarySide?: "yes" | "no") => void;
}) {
  const outcome = group?.outcomes[0];

  return (
    <LineMarketCard
      title="Both Teams to Score?"
      volume={group?.volume}
      actions={
        outcome ? (
          <>
            {(["yes", "no"] as const).map((binarySide) => {
              const buyable = isOutcomeBuyable(outcome, binarySide);

              return (
                <LineOutcomeButton
                  key={binarySide}
                  label={binarySide === "yes" ? "Yes" : "No"}
                  price={
                    buyable
                      ? resolveOutcomePrice(outcome, binarySide)
                      : undefined
                  }
                  variant={binarySide}
                  active={isOutcomeSelected(
                    outcome,
                    binarySide,
                    selectedOutcomeId,
                    selectedBinarySide
                  )}
                  disabled={!buyable}
                  onClick={
                    buyable ? () => onSelect(outcome, binarySide) : undefined
                  }
                />
              );
            })}
          </>
        ) : (
          <EmptyActions />
        )
      }
    />
  );
}

export function GameLinesPanel({
  groups,
  selectedOutcomeId,
  selectedBinarySide,
  onSelect
}: {
  groups: FixtureMarketGroup[];
  selectedOutcomeId?: string;
  selectedBinarySide?: "yes" | "no";
  onSelect: (outcome: FixtureMarketOutcome, binarySide?: "yes" | "no") => void;
}) {
  const moneylineGroup = findGroupByType(groups, "moneyline");
  const spreadGroup = findGroupByType(groups, "spread");
  const totalGroup = findGroupByType(groups, "total");
  const bttsGroup = findGroupByType(groups, "btts");

  return (
    <div className="flex flex-col gap-4">
      <MoneylineSection
        group={moneylineGroup}
        selectedOutcomeId={selectedOutcomeId}
        selectedBinarySide={selectedBinarySide}
        onSelect={onSelect}
      />
      <SpreadTotalSection
        group={spreadGroup}
        sectionTitle="Spreads"
        groupType="spread"
        selectedOutcomeId={selectedOutcomeId}
        selectedBinarySide={selectedBinarySide}
        onSelect={onSelect}
      />
      <SpreadTotalSection
        group={totalGroup}
        sectionTitle="Totals"
        groupType="total"
        selectedOutcomeId={selectedOutcomeId}
        selectedBinarySide={selectedBinarySide}
        onSelect={onSelect}
      />
      <BttsSection
        group={bttsGroup}
        selectedOutcomeId={selectedOutcomeId}
        selectedBinarySide={selectedBinarySide}
        onSelect={onSelect}
      />
    </div>
  );
}
