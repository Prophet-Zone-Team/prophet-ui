"use client";

import { resolveMatchSides } from "@/lib/market/schedule-match";
import type { GameMarketSnapshot, TeamMarketSnapshot } from "@/types/market";
import { gameColors } from "@/views/trade/game/ui";
import { formatChangePillLabel } from "@/views/trade/game/market-section/format-bid-label";
import { ChangePill, ProbabilityBar } from "@/views/trade/game/market-section/shared";

export interface GameMarketSectionProps {
  snapshot: GameMarketSnapshot;
  teamSnapshots: TeamMarketSnapshot[];
}

function getOutcomeProbability(
  snapshot: GameMarketSnapshot,
  side: "home" | "draw" | "away"
): number {
  return snapshot.outcomes.find((item) => item.side === side)?.probability ?? 0;
}

function getOutcomeChange(
  snapshot: GameMarketSnapshot,
  side: "home" | "draw" | "away"
): number | undefined {
  return snapshot.outcomes.find((item) => item.side === side)?.change24h;
}

export function GameMarketSection({
  snapshot,
  teamSnapshots
}: GameMarketSectionProps) {
  const sides = resolveMatchSides(snapshot.match, teamSnapshots);
  const homeProb = getOutcomeProbability(snapshot, "home");
  const drawProb = getOutcomeProbability(snapshot, "draw");
  const awayProb = getOutcomeProbability(snapshot, "away");

  const homeChange = formatChangePillLabel(getOutcomeChange(snapshot, "home"));
  const drawChange = formatChangePillLabel(getOutcomeChange(snapshot, "draw"));
  const awayChange = formatChangePillLabel(getOutcomeChange(snapshot, "away"));

  return (
    <section className="flex flex-col gap-2 py-6">
      <div className="flex justify-between items-center relative">
        <div>
          <p className="text-[60px] font-[556] capitalize leading-[72px]">
            {Math.round(homeProb)}%
          </p>
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-xl font-[400] capitalize leading-6 text-black min-w-[100px]">
              {sides.home.name}
            </p>
            {homeChange ? (
              <ChangePill label={homeChange} color={gameColors.home} />
            ) : null}
          </div>
        </div>
        <div
          className="absolute bottom-0"
          style={{
            left: Math.round(homeProb) + "%"
          }}
        >
          <p className="text-xl font-[556] capitalize leading-6">
            {Math.round(drawProb)}%
          </p>
          <div className="flex items-center gap-2">
            <p className="text-xl font-[400] capitalize leading-6 text-black">
              Draw
            </p>
            {drawChange ? (
              <ChangePill label={drawChange} color={gameColors.draw} />
            ) : null}
          </div>
        </div>
        <div>
          <p className="text-right text-[60px] font-[556] capitalize leading-[72px]">
            {Math.round(awayProb)}%
          </p>
          <div className="flex min-w-0 items-center justify-end gap-2">
            {awayChange ? (
              <ChangePill label={awayChange} color={gameColors.awayBar} />
            ) : null}
            <p className="truncate text-right text-xl font-[400] capitalize leading-6 text-black">
              {sides.away.name}
            </p>
          </div>
        </div>
      </div>

      <ProbabilityBar
        trackColor={gameColors.drawBar}
        segments={[
          { value: homeProb, color: gameColors.home },
          { value: drawProb, color: gameColors.draw },
          { value: awayProb, color: gameColors.awayBar }
        ]}
      />
    </section>
  );
}
