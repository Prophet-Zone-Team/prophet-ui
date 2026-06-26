import { formatScheduleKickoff } from "@/lib/market/schedule-match";
import { LiveIndicator } from "@/views/combo/combo-item/live-indicator";
import { MatchupTitle } from "@/views/combo/combo-item/matchup-title";
import type { ComboItemTeam } from "@/views/combo/combo-item/types";

export function MobileDrawerHeader({
  kickoffAt,
  kickoffLabel,
  isLive,
  homeTeam,
  awayTeam
}: {
  kickoffAt?: string;
  kickoffLabel: string;
  isLive?: boolean;
  homeTeam: ComboItemTeam;
  awayTeam: ComboItemTeam;
}) {
  const displayKickoff = kickoffAt
    ? formatScheduleKickoff(kickoffAt)
    : kickoffLabel;

  return (
    <div className="border-b border-[#EBEBEB] px-3 pb-3 pt-3">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <span className="text-xs font-[400] leading-[15px] text-[#909090]">
          {displayKickoff}
        </span>
        {isLive ? <LiveIndicator compact mobile /> : null}
      </div>

      <div className="mt-3 flex justify-center">
        <MatchupTitle homeTeam={homeTeam} awayTeam={awayTeam} mobile />
      </div>
    </div>
  );
}
