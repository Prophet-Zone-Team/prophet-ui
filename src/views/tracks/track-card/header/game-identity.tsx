import { TeamFlag } from "@/components/teams/team-flag";
import { MatchStatusBadge } from "@/components/match/match-status-badge";
import {
  formatScheduleKickoff,
  getScheduleRowVariant
} from "@/lib/market/schedule-match";
import type { Team, WorldCupMatch } from "@/types/market";
import { MatchBookmarkControl } from "@/views/home/matches/match-bookmark-control";

export type GameIdentityProps = {
  match: WorldCupMatch;
  homeTeam: Team;
  awayTeam: Team;
};

export function GameIdentity({ match, homeTeam, awayTeam }: GameIdentityProps) {
  const variant = getScheduleRowVariant(match.status);
  const kickoffLabel = formatScheduleKickoff(match.kickoffAt);
  const title = `${homeTeam.name} vs ${awayTeam.name}`;

  return (
    <div className="flex items-center gap-3 w-[38%]">
      <MatchBookmarkControl matchId={match.id} />
      <div className="flex shrink-0 items-center mx-[16px] w-[32px]">
        <TeamFlag
          code={homeTeam.code}
          name={homeTeam.name}
          className="relative top-[-8px] z-[1] h-[22px] w-[22px] rounded-[2px] text-[22px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
        />
        <TeamFlag
          code={awayTeam.code}
          name={awayTeam.name}
          className="relative left-[-10px] h-[22px] w-[22px] rounded-[2px] text-[22px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
        />
      </div>
      <div className="min-w-0">
        <h3 className="m-0 truncate text-[18px] font-[500] leading-[23px] text-black">
          {title}
        </h3>
        <div className="m-0 mt-0.5 flex min-w-0 items-center gap-1 truncate text-[12px] font-[400] leading-[15px]">
          <MatchStatusBadge
            variant={variant}
            size="sm"
            className="capitalize text-[12px] leading-[15px]"
          />
          <span className="text-[#909090]">{kickoffLabel}</span>
        </div>
      </div>
    </div>
  );
}
