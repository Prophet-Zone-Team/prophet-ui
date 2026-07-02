"use client";

import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { useLocalizedTeamRegion } from "@/hooks/i18n/use-localized-team-region";
import { TeamFlag } from "@/components/teams/team-flag";
import type { Team } from "@/types/market";
import { MarketBookmarkControl } from "@/views/home/winner/market-bookmark-control";

export type TeamIdentityProps = {
  team: Team;
  slug: string;
};

export function TeamIdentity({ team, slug }: TeamIdentityProps) {
  const displayName = useLocalizedTeamName(team.code, team.name);
  const regionLabel = useLocalizedTeamRegion(team.region);
  const subtitle = `${team.code} / ${regionLabel}`;

  return (
    <div className="flex w-full min-w-0 items-center gap-2 md:w-[38%] md:gap-3">
      <MarketBookmarkControl slug={slug} teamName={displayName} />
      <TeamFlag
        code={team.code}
        name={displayName}
        className="mx-0 h-7 w-7 shrink-0 rounded-[2px] text-[28px] md:mx-4 md:h-[32px] md:w-[32px] md:text-[32px]"
      />
      <div className="min-w-0">
        <h3 className="m-0 truncate text-[18px] font-[500] leading-[23px] text-prophet-foreground">
          {displayName}
        </h3>
        <p className="m-0 mt-0.5 truncate text-[12px] font-[400] leading-[15px] text-prophet-muted">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
