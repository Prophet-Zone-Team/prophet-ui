"use client";

import { useTranslations } from "next-intl";
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
  resolveOutcomeDisplayPrice,
  resolveSpreadVariant,
  resolveTotalVariant
} from "./fixture-market-actions";
import { MarketOtherSources, type MarketOtherSourceItem } from "./market-other-sources";

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
        const displayPrice = resolveOutcomeDisplayPrice(outcome, binarySide);
        const variant =
          groupType === "spread"
            ? resolveSpreadVariant(outcome)
            : groupType === "total"
              ? resolveTotalVariant(outcome)
              : resolveMoneylineVariant(outcome);

        return (
          <LineOutcomeButton
            key={`${outcome.id}-${displayPrice ?? "na"}`}
            label={outcome.label}
            price={displayPrice}
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
  otherSources,
  className
}: {
  volume?: number;
  lineSelector?: ReactNode;
  actions: ReactNode;
  otherSources?: MarketOtherSourceItem[];
  className?: string;
}) {
  const t = useTranslations("trade");
  const volumeLabel = formatCompactVolume(volume);

  return (
    <article className={cn(cardClass, className)}>
      <div className="flex flex-col md:items-center gap-2 p-3 md:flex-row md:gap-4 md:p-[16px]">
        <div className="min-w-[88px] shrink-0">
          {volumeLabel ? (
            <p className="m-0 text-[16px] md:text-[20px] font-[500] leading-6 text-black">
              {t("compactVolume", { value: volumeLabel })}
            </p>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-center">
          {lineSelector}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-start gap-2 md:justify-end">
          {actions}
        </div>
      </div>

      <MarketOtherSources
        sources={otherSources ?? []}
        className="border-t border-[#EBEBEB] p-3 md:p-[16px]"
      />
    </article>
  );
}

export function MoneylineActionRow({
  group,
  outcomesOverride,
  selectedOutcomeId,
  selectedBinarySide,
  otherSources,
  onSelect
}: {
  group?: FixtureMarketGroup;
  outcomesOverride?: FixtureMarketOutcome[];
  selectedOutcomeId?: string;
  selectedBinarySide?: "yes" | "no";
  otherSources?: MarketOtherSourceItem[];
  onSelect: (outcome: FixtureMarketOutcome, binarySide?: "yes" | "no") => void;
}) {
  const outcomes = useMemo(() => {
    if (outcomesOverride?.length) {
      return outcomesOverride;
    }

    return sortFixtureGroupOutcomes(group?.outcomes ?? [], "moneyline");
  }, [group?.outcomes, outcomesOverride]);

  return (
    <MarketActionRowShell
      volume={group?.volume}
      otherSources={otherSources}
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
  otherSources,
  onSelect
}: {
  outcomes: FixtureMarketOutcome[];
  selectedOutcomeId?: string;
  selectedBinarySide?: "yes" | "no";
  otherSources?: MarketOtherSourceItem[];
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
      otherSources={otherSources}
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
  otherSources,
  onSelect
}: {
  group?: FixtureMarketGroup;
  groupType: "spread" | "total";
  selectedLineKey?: string;
  onLineChange: (lineKey: string) => void;
  outcomesOverride?: FixtureMarketOutcome[];
  selectedOutcomeId?: string;
  selectedBinarySide?: "yes" | "no";
  otherSources?: MarketOtherSourceItem[];
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
      otherSources={otherSources}
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
