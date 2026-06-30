"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";
import { formatCompactVolume } from "@/lib/formatters/volume";
import { resolveFixtureBuyAsk } from "@/lib/market/fixture-ask-liquidity";
import type { FixtureMarketOutcome } from "@/types/market";
import { LineOutcomeButton } from "@/views/trade/game/fixture-markets/line-outcome-button";
import {
  MarketOtherSources,
  type MarketOtherSourceItem
} from "@/views/trade/game/markets/market-other-sources";

const cardClass =
  "rounded-[12px] border border-prophet-line bg-prophet-panel divide-y divide-[#EBEBEB]";

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
    (selectedBinarySide ?? "yes") === binarySide
  );
}

function formatOutcomeVolume(volume: number | undefined): string {
  return `${formatCompactVolume(volume) ?? "$0"} vol.`;
}

export function ExactScorePanel({
  outcomes,
  selectedOutcomeId,
  selectedBinarySide,
  resolveOtherSources,
  renderExpandedChart,
  onSelect
}: {
  outcomes: FixtureMarketOutcome[];
  selectedOutcomeId?: string;
  selectedBinarySide?: "yes" | "no";
  resolveOtherSources?: (
    outcome: FixtureMarketOutcome,
    binarySide: "yes" | "no"
  ) => MarketOtherSourceItem[];
  renderExpandedChart?: (outcome: FixtureMarketOutcome) => ReactNode;
  onSelect: (outcome: FixtureMarketOutcome, binarySide?: "yes" | "no") => void;
}) {
  const [expandedOutcomeId, setExpandedOutcomeId] = useState<
    string | undefined
  >();

  if (!outcomes.length) {
    return (
      <div className="rounded-[12px] border border-dashed border-prophet-line px-4 py-10 text-center">
        <p className="m-0 text-sm font-[400] leading-[17px] text-[#909090]">
          No exact score markets available for this match.
        </p>
      </div>
    );
  }

  const handleRowClick = (outcomeId: string) => {
    setExpandedOutcomeId((prev) => (prev === outcomeId ? undefined : outcomeId));
  };

  return (
    <div className={cardClass}>
      {outcomes.map((outcome) => {
        const isExpanded = expandedOutcomeId === outcome.id;
        const otherSourcesBinarySide =
          selectedOutcomeId === outcome.id
            ? (selectedBinarySide ?? "yes")
            : "yes";

        return (
          <div key={outcome.id}>
            <div
              className={cn(
                "flex cursor-pointer flex-col flex-wrap items-stretch justify-between gap-4 p-[16px] transition-colors hover:bg-[#F5F5F5] md:flex-row md:items-center",
                isExpanded && "bg-[#F5F5F5]"
              )}
              onClick={() => handleRowClick(outcome.id)}
            >
              <div className="min-w-0 shrink-0">
                <h3 className="m-0 text-[18px] font-[500] leading-6 text-prophet-foreground">
                  Exact Score: {outcome.label}
                </h3>
                <p className="m-0 mt-[6px] text-[14px] font-[500] leading-[17px] text-[#909090]">
                  {formatOutcomeVolume(outcome.volume)}
                </p>
              </div>

              <div
                className="flex shrink-0 flex-wrap items-center justify-between gap-2 md:justify-end"
                onClick={(event) => event.stopPropagation()}
              >
                {(["yes", "no"] as const).map((binarySide) => {
                  const buyable = isOutcomeBuyable(outcome, binarySide);

                  return (
                    <LineOutcomeButton
                      key={`${outcome.id}-${binarySide}-${buyable ? resolveFixtureBuyAsk(outcome, binarySide) : "na"}`}
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
                      className="flex-1 md:flex-grow-0"
                    />
                  );
                })}
              </div>
            </div>

            {isExpanded ? (
              <div className="border-t border-prophet-line">
                <MarketOtherSources
                  sources={
                    resolveOtherSources?.(
                      outcome,
                      otherSourcesBinarySide
                    ) ?? []
                  }
                  className="p-3 md:p-[16px]"
                />
                {renderExpandedChart?.(outcome)}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
