import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";

import type { TeamPowerRankingPathDifficulty } from "./types";

export type PathDifficultyLabelProps = {
  difficulty: TeamPowerRankingPathDifficulty;
  className?: string;
};

export function PathDifficultyLabel({
  difficulty,
  className
}: PathDifficultyLabelProps) {
  const t = useTranslations("analytics");

  return (
    <span
      className={cn(
        "text-[16px] font-[400] leading-[19px]",
        difficulty === "Hard" ? "text-[#FF674B]" : "text-[#909090]",
        className
      )}
    >
      {difficulty === "Hard" ? t("pathDifficultyHard") : t("pathDifficultyModerate")}
    </span>
  );
}
