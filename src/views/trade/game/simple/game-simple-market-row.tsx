"use client";

import { useState } from "react";

import { cn } from "@/lib/cn";
import { resolveMatchSides } from "@/lib/market/schedule-match";
import type {
  GameMarketSnapshot,
  MatchOutcomeSide,
  TeamMarketSnapshot
} from "@/types/market";
import {
  formatSimpleBidLabel,
  GameSimpleBuySheet,
  getGameSimpleBidPrice
} from "@/views/trade/game/simple/game-simple-buy-sheet";
import { gameSimpleColors } from "@/views/trade/game/simple/game-simple-ui";

export interface GameSimpleMarketRowProps {
  snapshot: GameMarketSnapshot;
  teamSnapshots: TeamMarketSnapshot[];
}

export function GameSimpleMarketRow({
  snapshot,
  teamSnapshots
}: GameSimpleMarketRowProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<MatchOutcomeSide | null>(
    null
  );
  const sides = resolveMatchSides(snapshot.match, teamSnapshots);
  const homeProb =
    snapshot.outcomes.find((item) => item.side === "home")?.probability ?? 0;
  const drawProb =
    snapshot.outcomes.find((item) => item.side === "draw")?.probability ?? 0;
  const awayProb =
    snapshot.outcomes.find((item) => item.side === "away")?.probability ?? 0;

  return (
    <section className="flex flex-col gap-5 py-6">
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3 text-black">
        <OutcomeStat label={sides.home.name} value={homeProb} align="left" large />
        <OutcomeStat label="Draw" value={drawProb} align="center" />
        <OutcomeStat label={sides.away.name} value={awayProb} align="right" />
      </div>

      <SimpleProbabilityBar home={homeProb} draw={drawProb} away={awayProb} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <BidButton
          label={formatSimpleBidLabel(getGameSimpleBidPrice(snapshot, "home"))}
          background={gameSimpleColors.home}
          onClick={() => setSelectedOutcome("home")}
        />
        <BidButton
          label={formatSimpleBidLabel(getGameSimpleBidPrice(snapshot, "draw"))}
          background={gameSimpleColors.draw}
          onClick={() => setSelectedOutcome("draw")}
        />
        <BidButton
          label={formatSimpleBidLabel(getGameSimpleBidPrice(snapshot, "away"))}
          background={gameSimpleColors.awayBar}
          onClick={() => setSelectedOutcome("away")}
        />
      </div>

      {selectedOutcome ? (
        <GameSimpleBuySheet
          snapshot={snapshot}
          outcomeSide={selectedOutcome}
          onClose={() => setSelectedOutcome(null)}
        />
      ) : null}
    </section>
  );
}

function OutcomeStat({
  label,
  value,
  align,
  large = false
}: {
  label: string;
  value: number;
  align: "left" | "center" | "right";
  large?: boolean;
}) {
  return (
    <div
      className={cn(
        "min-w-0",
        align === "left"
          ? "text-left"
          : align === "right"
            ? "text-right"
            : "text-center"
      )}
    >
      <p className="truncate text-xl font-[556] capitalize leading-6 text-black">
        {label}
      </p>
      <p
        className={cn(
          "font-[556] capitalize text-black",
          large ? "text-[60px] leading-[72px]" : "text-xl leading-6"
        )}
      >
        {Math.round(value)}%
      </p>
    </div>
  );
}

function SimpleProbabilityBar({
  home,
  draw,
  away
}: {
  home: number;
  draw: number;
  away: number;
}) {
  const total = home + draw + away || 1;
  const homeWidth = (home / total) * 100;
  const drawWidth = (draw / total) * 100;
  const awayWidth = (away / total) * 100;

  return (
    <div
      className="relative h-5 w-full overflow-hidden rounded-[10px]"
      style={{ backgroundColor: gameSimpleColors.drawBar }}
      aria-hidden
    >
      <div
        className="absolute inset-y-0 left-0"
        style={{
          width: `${homeWidth}%`,
          backgroundColor: gameSimpleColors.home
        }}
      />
      <div
        className="absolute inset-y-0"
        style={{
          left: `${homeWidth}%`,
          width: `${drawWidth}%`,
          backgroundColor: gameSimpleColors.draw
        }}
      />
      <div
        className="absolute inset-y-0 right-0"
        style={{
          width: `${awayWidth}%`,
          backgroundColor: gameSimpleColors.awayBar
        }}
      />
    </div>
  );
}

function BidButton({
  label,
  background,
  onClick
}: {
  label: string;
  background: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[58px] w-full items-center justify-center rounded-[12px] border-0 text-xl font-[556] leading-6 text-white transition-opacity hover:opacity-90"
      style={{ backgroundColor: background }}
    >
      {label}
    </button>
  );
}
