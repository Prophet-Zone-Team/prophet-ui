"use client";

import { BookmarkToggle } from "../../../components/bookmark/BookmarkToggle";
import { TrackLink, TrackTooltip } from "../../../components/bookmark/TrackTooltip";
import { useIsMatchTracked, useToggleTrackedMatch } from "../../../store";
import { useTracksHydrated } from "../../../store/useTracksHydrated";

export interface MatchBookmarkControlProps {
  matchId: string;
}

export function MatchBookmarkControl({ matchId }: MatchBookmarkControlProps) {
  const isTracked = useIsMatchTracked(matchId);
  const toggleMatch = useToggleTrackedMatch();
  const hasHydrated = useTracksHydrated();
  const showTracked = hasHydrated && isTracked;

  return (
    <BookmarkToggle
      isTracked={showTracked}
      ariaLabel={showTracked ? "Remove match from Track" : "Add match to Track"}
      onToggle={() => toggleMatch(matchId)}
      tooltip={
        <TrackTooltip>
          Tracked matches appear in <TrackLink /> alongside your subscribed
          teams.
        </TrackTooltip>
      }
    />
  );
}
