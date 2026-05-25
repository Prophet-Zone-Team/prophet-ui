import { cn } from "@/lib/cn";

import { ViewFullRankingLink } from "./view-full-ranking-link";

export type RankingHeaderProps = {
  onViewFullRanking: () => void;
  className?: string;
};

export function RankingHeader({
  onViewFullRanking,
  className
}: RankingHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between gap-3 px-[20px] pt-[20px]",
        className
      )}
    >
      <h2 className="m-0 text-[18px] font-[300] leading-[21px] text-black">
        Team Power Ranking
      </h2>
      <ViewFullRankingLink onClick={onViewFullRanking} />
    </header>
  );
}
