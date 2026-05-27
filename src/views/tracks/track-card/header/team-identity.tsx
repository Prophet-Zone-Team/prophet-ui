import { TeamFlag } from "@/components/teams/team-flag";
import type { Team } from "@/types/market";
import { MarketBookmarkControl } from "@/views/home/winner/market-bookmark-control";

export type TeamIdentityProps = {
  team: Team;
};

export function TeamIdentity({ team }: TeamIdentityProps) {
  const subtitle = `${team.code} / ${team.region}`;

  return (
    <div className="flex w-[38%] items-center gap-3">
      <MarketBookmarkControl teamId={team.id} />
      <TeamFlag
        code={team.code}
        name={team.name}
        className="mx-[16px] h-[32px] w-[32px] shrink-0 rounded-[2px] text-[32px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
      />
      <div className="min-w-0">
        <h3 className="m-0 truncate text-[18px] font-[500] leading-[23px] text-black">
          {team.name}
        </h3>
        <p className="m-0 mt-0.5 truncate text-[12px] font-[400] leading-[15px] text-[#909090]">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
