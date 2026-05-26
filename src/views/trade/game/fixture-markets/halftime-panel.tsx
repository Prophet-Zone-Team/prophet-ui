"use client";

import { resolveFixtureBuyAsk } from "@/lib/market/fixture-ask-liquidity";
import type { FixtureMarketOutcome } from "@/types/market";
import { LineMarketCard } from "@/views/trade/game/fixture-markets/line-market-card";
import {
  LineOutcomeButton,
  type LineOutcomeButtonVariant
} from "@/views/trade/game/fixture-markets/line-outcome-button";

function resolveHalftimeVariant(
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

function isOutcomeBuyable(
  outcome: FixtureMarketOutcome,
  binarySide: "yes" | "no"
): boolean {
  return resolveFixtureBuyAsk(outcome, binarySide) !== undefined;
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

export function HalftimePanel({
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
  if (!outcomes.length) {
    return <HalftimeEmptyState />;
  }

  const totalVolume = outcomes.reduce((sum, item) => sum + (item.volume ?? 0), 0);

  return (
    <LineMarketCard
      title="Half-time Result"
      volume={totalVolume}
      actions={outcomes.map((outcome) => {
        const buyable = isOutcomeBuyable(outcome, "yes");

        return (
          <LineOutcomeButton
            key={outcome.id}
            label={outcome.label}
            price={buyable ? resolveFixtureBuyAsk(outcome, "yes") : undefined}
            variant={resolveHalftimeVariant(outcome)}
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
      })}
    />
  );
}

function HalftimeEmptyState() {
  return (
    <div className="rounded-[12px] border border-dashed border-[#EBEBEB] px-4 py-10 text-center">
      <p className="m-0 text-sm font-[457] leading-[17px] text-[#909090]">
        No half-time markets available for this match.
      </p>
    </div>
  );
}
