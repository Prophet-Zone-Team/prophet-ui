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
  const { team, market } = snapshot;

  return (
    <TrackCardShell
      className={className}
      ariaLabel={`${team.name} track card`}
      header={
        <>
          <TeamIdentity
            team={team}
            slug={market.polymarket?.slug || ""}
          />
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
