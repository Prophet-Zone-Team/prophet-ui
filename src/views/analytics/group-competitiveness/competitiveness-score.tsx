import { cn } from "@/lib/cn";

import { formatCompetitivenessScore } from "./format";

export type CompetitivenessScoreProps = {
  score: number;
  size?: "large" | "small";
  className?: string;
};

export function CompetitivenessScore({
  score,
  size = "large",
  className
}: CompetitivenessScoreProps) {
  const isLarge = size === "large";

  return (
    <span
      className={cn(
        "whitespace-nowrap tabular-nums",
        isLarge
          ? "text-[22px] font-[500] leading-[26px] md:text-[26px] md:leading-[31px]"
          : "text-[14px] font-[400] leading-[17px] text-[#909090]",
        className
      )}
    >
      {isLarge ? (
        <>
          <span className="text-black">{score}</span>
          <span className="text-[#909090]">/100</span>
        </>
      ) : (
        formatCompetitivenessScore(score)
      )}
    </span>
  );
}
