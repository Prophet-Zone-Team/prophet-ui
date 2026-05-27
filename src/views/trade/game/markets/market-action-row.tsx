"use client";

import { useMemo, type ReactNode } from "react";

import { formatCompactVolume } from "@/lib/formatters/volume";
import { cn } from "@/lib/cn";
import {
  getFixtureLineOptions,
  getFixtureOutcomesForGroup,
  sortFixtureGroupOutcomes
} from "@/lib/market/build-fixture-markets-snapshot";
import type { FixtureMarketGroup, FixtureMarketOutcome } from "@/types/market";
import { LineOutcomeButton } from "@/views/trade/game/fixture-markets/line-outcome-button";
import { LineSelector } from "@/views/trade/game/fixture-markets/line-selector";
import {
  findFixtureGroupByType,
  isOutcomeBuyable,
  isOutcomeSelected,
  resolveLineBinarySide,
  resolveMoneylineVariant,
  resolveOutcomePrice,
  resolveSpreadVariant,
  resolveTotalVariant
} from "./fixture-market-actions";

const cardClass = "rounded-[12px] border border-[#EBEBEB] bg-white";

function EmptyActions() {
  return <LineOutcomeButton label="—" variant="draw" disabled />;
}

function OutcomeButtons({
  outcomes,
  groupType,
  selectedOutcomeId,
  selectedBinarySide,
  onSelect
}: {
  outcomes: FixtureMarketOutcome[];
  groupType?: "spread" | "total";
  selectedOutcomeId?: string;
  selectedBinarySide?: "yes" | "no";
  onSelect: (outcome: FixtureMarketOutcome, binarySide?: "yes" | "no") => void;
}) {
  if (!outcomes.length) {
    return <EmptyActions />;
  }

  return (
    <>
      {outcomes.map((outcome) => {
        const binarySide = groupType
          ? resolveLineBinarySide(outcome, groupType)
          : ("yes" as const);
        const buyable = isOutcomeBuyable(outcome, binarySide);
        const variant =
          groupType === "spread"
            ? resolveSpreadVariant(outcome)
            : groupType === "total"
              ? resolveTotalVariant(outcome)
              : resolveMoneylineVariant(outcome);

        return (
          <LineOutcomeButton
            key={outcome.id}
            label={outcome.label}
            price={
              buyable ? resolveOutcomePrice(outcome, binarySide) : undefined
            }
            variant={variant}
            active={isOutcomeSelected(
              outcome,
              binarySide,
              selectedOutcomeId,
              selectedBinarySide
            )}
            disabled={!buyable}
            onClick={buyable ? () => onSelect(outcome, binarySide) : undefined}
          />
        );
      })}
    </>
  );
}

function MarketActionRowShell({
  volume,
  lineSelector,
  actions,
  className
}: {
  volume?: number;
  lineSelector?: ReactNode;
  actions: ReactNode;
  className?: string;
}) {
  const volumeLabel = formatCompactVolume(volume);

  return (
    <article className={cn(cardClass, "p-[16px]", className)}>
      <div className="flex items-center gap-4">
        <div className="min-w-[88px] shrink-0">
          {volumeLabel ? (
            <p className="m-0 text-[20px] font-[556] leading-6 text-black">
              {volumeLabel} Vol.
            </p>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-center">
          {lineSelector}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {actions}
        </div>
      </div>
    </article>
  );
}

export function MoneylineActionRow({
  group,
  outcomesOverride,
  selectedOutcomeId,
  selectedBinarySide,
  onSelect
}: {
  group?: FixtureMarketGroup;
  outcomesOverride?: FixtureMarketOutcome[];
  selectedOutcomeId?: string;
  selectedBinarySide?: "yes" | "no";
  onSelect: (outcome: FixtureMarketOutcome, binarySide?: "yes" | "no") => void;
}) {
  const outcomes = useMemo(
    () =>
      outcomesOverride ??
      sortFixtureGroupOutcomes(group?.outcomes ?? [], "moneyline"),
    [group?.outcomes, outcomesOverride]
  );

  return (
    <MarketActionRowShell
      volume={group?.volume}
      actions={
        <OutcomeButtons
          outcomes={outcomes}
          selectedOutcomeId={selectedOutcomeId}
          selectedBinarySide={selectedBinarySide}
          onSelect={onSelect}
        />
      }
    />
  );
}

export function HalftimeActionRow({
  outcomes,
  selectedOutcomeId,
  selectedBinarySide,
  onSelect
}: {
  outcomes: FixtureMarketOutcome[];
  selectedOutcomeId?: string;
  selectedBinarySide?: "yes" | "no";
  onSelect: (outcome: FixtureMarketOutcome, binarySide?: "yes" | "no") => void;
}) {
  const sortedOutcomes = useMemo(
    () => sortFixtureGroupOutcomes(outcomes, "halftime"),
    [outcomes]
  );
  const totalVolume = outcomes.reduce(
    (sum, item) => sum + (item.volume ?? 0),
    0
  );

  return (
    <MarketActionRowShell
      volume={totalVolume}
      actions={
        <OutcomeButtons
          outcomes={sortedOutcomes}
          selectedOutcomeId={selectedOutcomeId}
          selectedBinarySide={selectedBinarySide}
          onSelect={onSelect}
        />
      }
    />
  );
}

export function LineGroupActionRow({
  group,
  groupType,
  selectedLineKey,
  onLineChange,
  outcomesOverride,
  selectedOutcomeId,
  selectedBinarySide,
  onSelect
}: {
  group?: FixtureMarketGroup;
  groupType: "spread" | "total";
  selectedLineKey?: string;
  onLineChange: (lineKey: string) => void;
  outcomesOverride?: FixtureMarketOutcome[];
  selectedOutcomeId?: string;
  selectedBinarySide?: "yes" | "no";
  onSelect: (outcome: FixtureMarketOutcome, binarySide?: "yes" | "no") => void;
}) {
  const lineOptions = useMemo(
    () => (group ? getFixtureLineOptions(group) : []),
    [group]
  );
  const activeLineKey =
    selectedLineKey ?? group?.defaultLineKey ?? lineOptions[0]?.key;
  const visibleOutcomes = useMemo(() => {
    if (outcomesOverride) {
      return outcomesOverride;
    }

    if (!group) {
      return [];
    }

    return sortFixtureGroupOutcomes(
      getFixtureOutcomesForGroup(group, activeLineKey),
      groupType
    );
  }, [activeLineKey, group, groupType, outcomesOverride]);

  return (
    <MarketActionRowShell
      volume={group?.volume}
      lineSelector={
        lineOptions.length ? (
          <LineSelector
            options={lineOptions}
            value={activeLineKey}
            onChange={onLineChange}
            variant="pill"
          />
        ) : null
      }
      actions={
        <OutcomeButtons
          outcomes={visibleOutcomes}
          groupType={groupType}
          selectedOutcomeId={selectedOutcomeId}
          selectedBinarySide={selectedBinarySide}
          onSelect={onSelect}
        />
      }
    />
  );
}

export function resolveLineGroupForTab(
  lines: FixtureMarketGroup[],
  tab: "totals" | "spreads"
) {
  return findFixtureGroupByType(lines, tab === "totals" ? "total" : "spread");
}
