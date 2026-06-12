"use client";

import { useTranslations } from "next-intl";

import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { TrackCardActions } from "./header/actions";
import { TeamIdentity } from "./header/team-identity";
import { TeamStatsRow } from "./header/stats-row";
import { TrackCardFooter } from "./footer";
import { TrackCardShell } from "./shell";
import type { TrackCardTeamProps } from "./types";

export function TeamTrackCard({
  snapshot,
  powerRanking,
  signals,
  signalItems,
  youBid,
  className
}: TrackCardTeamProps) {
  const t = useTranslations("tracks");
  const { team, market } = snapshot;
  const displayName = useLocalizedTeamName(team.code, team.name);

  return (
    <TrackCardShell
      className={className}
      ariaLabel={t("teamTrackCardAria", { teamName: displayName })}
      header={
        <>
          <TeamIdentity team={team} slug={market?.slug || ""} />
          <TeamStatsRow
            probability={market.probability}
            change24h={market.change24h}
            volume={market.volume}
            youBid={youBid}
          />
          <TrackCardActions variant="team" snapshot={snapshot} />
        </>
      }
      footer={
        <TrackCardFooter
          variant="team"
          signals={signals}
          powerRanking={powerRanking}
          signalItems={signalItems}
        />
      }
    />
  );
}
