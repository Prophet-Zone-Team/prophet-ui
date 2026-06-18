import type { ComboItemTeam } from "@/views/combo/combo-item/types";
import { TeamRow } from "@/views/combo/combo-item/team-row";

export function MatchupTitle({
  homeTeam,
  awayTeam
}: {
  homeTeam: ComboItemTeam;
  awayTeam: ComboItemTeam;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <TeamRow team={homeTeam} flagSize="md" />
      <span className="text-lg font-[500] leading-[23px] text-[#909090]">vs</span>
      <TeamRow team={awayTeam} flagSize="md" />
    </div>
  );
}
