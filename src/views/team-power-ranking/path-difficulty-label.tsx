import { cn } from "@/lib/cn";

import type { TeamPowerRankingPathDifficulty } from "./types";

export type PathDifficultyLabelProps = {
  difficulty: TeamPowerRankingPathDifficulty;
  className?: string;
};

const LABELS: Record<TeamPowerRankingPathDifficulty, string> = {
  Medium: "Moderate",
  Hard: "Hard"
};

export function PathDifficultyLabel({
  difficulty,
  className
}: PathDifficultyLabelProps) {
  return (
    <span
      className={cn(
        "text-[16px] font-[400] leading-[19px]",
        difficulty === "Hard" ? "text-[#FF674B]" : "text-[#909090]",
        className
      )}
    >
      {LABELS[difficulty]}
    </span>
  );
}
