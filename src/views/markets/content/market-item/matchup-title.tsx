import type { MarketItemTeam } from "@/views/markets/content/market-item/types";
import { TeamRow } from "@/views/markets/content/market-item/team-row";

export function MatchupTitle({
  homeTeam,
  awayTeam
}: {
  homeTeam: MarketItemTeam;
  awayTeam: MarketItemTeam;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <TeamRow team={homeTeam} flagSize="md" />
      <span className="text-[16px] font-[500] leading-[20px] text-[#909090]">
        vs
      </span>
      <TeamRow team={awayTeam} flagSize="md" />
    </div>
  );
}
