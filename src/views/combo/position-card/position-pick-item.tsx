import type { PositionPick } from "./types";
import { PositionPickTeamFlag } from "./position-pick-team-flag";
import { resolvePickTeamFromMarketTitle } from "./resolve-pick-team";
import { cn } from "@/lib/cn";

export type PositionPickItemProps = {
  pick: PositionPick;
};

export function PositionPickItem({ pick }: PositionPickItemProps) {
  const team = resolvePickTeamFromMarketTitle(pick.marketTitle);

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "shrink-0 h-[23px] w-[23px] flex items-center justify-center"
        )}
      >
        <PositionPickTeamFlag
          logoUrl={team?.logo ?? pick.team.logoUrl}
          code={pick.team.code}
          name={pick.marketTitle}
          legStatus={pick.legStatus}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="m-0 truncate text-xs font-[400] leading-[15px] text-black">
          {pick.matchupLabel}
        </p>
        <p className="m-0 truncate text-sm font-[500] leading-[18px] text-black">
          {pick.selectionLabel}
        </p>
      </div>
    </div>
  );
}
