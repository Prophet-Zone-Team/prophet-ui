"use client";

import { formatCompactVolume } from "@/lib/formatters/volume";
import { resolveFixtureBuyAsk } from "@/lib/market/fixture-ask-liquidity";
import type { FixtureMarketOutcome } from "@/types/market";
import { LineOutcomeButton } from "@/views/trade/game/fixture-markets/line-outcome-button";

const cardClass = "rounded-[12px] border border-[#EBEBEB] bg-white divide-y divide-[#EBEBEB]";

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

function formatOutcomeVolume(volume: number | undefined): string {
  return `${formatCompactVolume(volume) ?? "$0"} vol.`;
}

export function ExactScorePanel({
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
    return (
      <div className="rounded-[12px] border border-dashed border-[#EBEBEB] px-4 py-10 text-center">
        <p className="m-0 text-sm font-[457] leading-[17px] text-[#909090]">
          No exact score markets available for this match.
        </p>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      {outcomes.map((outcome) => (
        <div
          key={outcome.id}
          className="flex flex-wrap items-center justify-between gap-4 p-[16px] transition-colors hover:bg-[#F5F5F5]"
        >
          <div className="min-w-0 shrink-0">
            <h3 className="m-0 text-[20px] font-[500] leading-6 text-black">
              Exact Score: {outcome.label}
            </h3>
            <p className="m-0 mt-[6px] text-[14px] font-[500] leading-[17px] text-[#909090]">
              {formatOutcomeVolume(outcome.volume)}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {(["yes", "no"] as const).map((binarySide) => {
              const buyable = isOutcomeBuyable(outcome, binarySide);

              return (
                <LineOutcomeButton
                  key={binarySide}
                  label={binarySide === "yes" ? "Yes" : "No"}
                  price={
                    buyable
                      ? resolveFixtureBuyAsk(outcome, binarySide)
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
          </div>
        </div>
      ))}
    </div>
  );
}
