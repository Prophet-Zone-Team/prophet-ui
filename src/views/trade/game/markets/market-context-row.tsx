import { RelatedNews } from "@/views/trade/game/related-news";
import { MatchHistory } from "@/views/trade/game/match-history";

export type MarketContextRowProps = {
  defaultTeamId?: string;
};

export function MarketContextRow({ defaultTeamId }: MarketContextRowProps) {
  return (
    <div className="mt-[8px] flex flex-col gap-4 lg:flex-row lg:items-start">
      <RelatedNews className="min-w-0 flex-1 max-w-none" />
      <MatchHistory
        defaultTeamId={defaultTeamId}
        className="min-w-0 flex-1 max-w-none"
      />
    </div>
  );
}
