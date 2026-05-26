"use client";

import type { MatchOutcomeProbabilities } from "@/lib/market/match-outcome-odds";
import { ProbabilityBar } from "@/views/trade/game/market-section/shared";
import { gameColors } from "@/views/trade/game/ui";

export interface ScheduleMatchOutcomeBarProps {
  probabilities: MatchOutcomeProbabilities;
  height?: number;
}

export function ScheduleMatchOutcomeBar({
  probabilities,
  height = 8
}: ScheduleMatchOutcomeBarProps) {
  return (
    <div className="pt-[20px]">
      <ProbabilityBar
        height={height}
        trackColor={gameColors.drawBar}
        segments={[
          { value: probabilities.home * 100, color: gameColors.home },
          { value: probabilities.draw * 100, color: gameColors.draw },
          { value: probabilities.away * 100, color: gameColors.awayBar }
        ]}
      />
    </div>
  );
}
