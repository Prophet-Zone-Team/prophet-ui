import { cn } from "@/lib/cn";
import {
  comboMutedTextClass,
  comboTitleTextClass
} from "@/views/combo/combo-ui";

import type { PositionPick } from "./types";
import { PositionPickTeamFlag } from "./position-pick-team-flag";
import { resolvePickTeamFromMarketTitle } from "./resolve-pick-team";

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
        <p className={cn("m-0 truncate text-xs font-[400] leading-[15px] text-left", comboMutedTextClass)}>
          {pick.matchupLabel}
        </p>
        <p className={cn("m-0 truncate text-sm font-[500] leading-[18px] text-left", comboTitleTextClass)}>
          {pick.selectionLabel}
        </p>
      </div>
    </div>
  );
}
