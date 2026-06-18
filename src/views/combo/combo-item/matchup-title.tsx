import type { ComboItemTeam } from "@/views/combo/combo-item/types";
import { TeamRow } from "@/views/combo/combo-item/team-row";

export function MatchupTitle({
  homeTeam,
  awayTeam,
  mobile = false
}: {
  homeTeam: ComboItemTeam;
  awayTeam: ComboItemTeam;
  mobile?: boolean;
}) {
  if (mobile) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
        <TeamRow team={homeTeam} flagSize="xs" layout="inline" />
        <span className="text-lg font-[500] leading-[23px] text-[#909090]">vs</span>
        <TeamRow team={awayTeam} flagSize="xs" layout="inline" />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
      <TeamRow team={homeTeam} flagSize="md" layout="inline" />
      <span className="text-base font-[500] leading-[21px] text-[#909090] sm:text-lg sm:leading-[23px]">
        vs
      </span>
      <TeamRow team={awayTeam} flagSize="md" layout="inline" />
    </div>
  );
}
