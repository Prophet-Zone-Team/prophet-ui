import { cn } from "@/lib/cn";

import { ViewFullRankingLink } from "./view-full-ranking-link";

export type RankingHeaderProps = {
  className?: string;
};

export function RankingHeader({ className }: RankingHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between gap-3 px-3 md:px-[20px] pt-4 md:pt-[20px]",
        className
      )}
    >
      <h2 className="m-0 text-base md:text-[18px] font-[400] leading-[21px] text-black">
        Team Power Ranking
      </h2>
      <ViewFullRankingLink />
    </header>
  );
}
