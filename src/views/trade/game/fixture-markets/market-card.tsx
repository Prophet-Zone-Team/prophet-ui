"use client";

import type { ReactNode } from "react";

import { resolveFixtureBuyAsk } from "@/lib/market/fixture-ask-liquidity";
import { formatCompactVolume } from "@/lib/formatters/volume";
import type { FixtureMarketOutcome } from "@/types/market";
import {
  GameOutcomeBidButton,
  type GameOutcomeBidButtonSize
} from "@/views/trade/shared/game-outcome-bid-buttons";

const cardClass = "rounded-[12px] border border-[#EBEBEB] bg-white p-4 sm:p-5";

export function MarketCard({
  title,
  volume,
  children
}: {
  title: string;
  volume?: number;
  children: ReactNode;
}) {
  const volumeLabel = formatCompactVolume(volume);

  return (
    <article className={cardClass}>
      <MarketCardHeader title={title} volumeLabel={volumeLabel} />
      {children}
    </article>
  );
}

function MarketCardHeader({
  title,
  volumeLabel
}: {
  title: string;
  volumeLabel?: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h3 className="m-0 text-base font-[500] leading-[19px] text-black">
        {title}
      </h3>
      {volumeLabel ? (
        <p className="m-0 text-sm font-[400] leading-[17px] text-[#909090]">
          {volumeLabel} Vol.
        </p>
      ) : null}
    </div>
  );
}

export function OutcomeButtonRow({
  outcomes,
  selectedOutcomeId,
  selectedBinarySide,
  onSelect,
  columns = 3,
  size = "default"
}: {
  outcomes: Array<{
    outcome: FixtureMarketOutcome;
    binarySide?: "yes" | "no";
    background: string;
  }>;
  selectedOutcomeId?: string;
  selectedBinarySide?: "yes" | "no";
  onSelect: (outcome: FixtureMarketOutcome, binarySide?: "yes" | "no") => void;
  columns?: 2 | 3 | 4;
  size?: GameOutcomeBidButtonSize;
}) {
  const gridClass =
    columns === 2
      ? "grid-cols-2"
      : columns === 4
        ? "grid-cols-2 sm:grid-cols-4"
        : "grid-cols-1 sm:grid-cols-3";

  return (
    <div className={`grid gap-3 ${gridClass}`}>
      {outcomes.map(({ outcome, binarySide = "yes", background }) => {
        const isActive =
          selectedOutcomeId === outcome.id &&
          (binarySide === undefined || selectedBinarySide === binarySide);
        const buyable = resolveFixtureBuyAsk(outcome, binarySide) !== undefined;

        return (
          <GameOutcomeBidButton
            key={`${outcome.id}:${binarySide}`}
            title={outcome.label}
            price={
              buyable ? resolveFixtureBuyAsk(outcome, binarySide) : undefined
            }
            background={background}
            active={isActive}
            disabled={!buyable}
            size={size}
            onClick={buyable ? () => onSelect(outcome, binarySide) : undefined}
          />
        );
      })}
    </div>
  );
}
