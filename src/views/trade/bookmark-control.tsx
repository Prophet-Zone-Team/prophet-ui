"use client";

import { BookmarkToggle } from "../../components/bookmark/bookmark-toggle";
import { TrackLink, TrackTooltip } from "../../components/bookmark/track-tooltip";
import { useIsTeamTracked, useToggleTrackedTeam } from "../../store";
import { useTracksHydrated } from "../../store/use-tracks-hydrated";

export interface BookmarkControlProps {
  teamId: string;
  teamName: string;
}

export function BookmarkControl({ teamId, teamName }: BookmarkControlProps) {
  const isTracked = useIsTeamTracked(teamId);
  const toggleTeam = useToggleTrackedTeam();
  const hasHydrated = useTracksHydrated();
  const showTracked = hasHydrated && isTracked;

  return (
    <BookmarkToggle
      isTracked={showTracked}
      ariaLabel={
        showTracked ? `Remove ${teamName} from Track` : `Add ${teamName} to Track`
      }
      onToggle={() => toggleTeam(teamId)}
      tooltip={
        <TrackTooltip>
          You subscribed will be listed in <TrackLink />, and team changes will
          be notified in time.
        </TrackTooltip>
      }
    />
  );
}
