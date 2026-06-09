"use client";

import { BookmarkToggle } from "@/components/bookmark/bookmark-toggle";
import type { ProphetBookmarkTarget } from "@/lib/tracks/track-status";
import { TrackLink, TrackTooltip } from "@/components/bookmark/track-tooltip";

export interface MatchBookmarkControlProps {
  matchId: string;
  homeTeamName: string;
  awayTeamName: string;
}

export function MatchBookmarkControl({
  matchId,
  homeTeamName,
  awayTeamName
}: MatchBookmarkControlProps) {
  const target: ProphetBookmarkTarget = {
    category: "game",
    slug: matchId,
    homeTeamName,
    awayTeamName
  };

  return (
    <BookmarkToggle
      target={target}
      ariaLabel="Add match to Track"
      trackedAriaLabel="Remove match from Track"
      tooltip={
        <TrackTooltip>
          Tracked matches appear in <TrackLink /> alongside your subscribed
          teams.
        </TrackTooltip>
      }
    />
  );
}
