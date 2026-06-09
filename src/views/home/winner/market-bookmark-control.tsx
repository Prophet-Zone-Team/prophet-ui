"use client";

import { BookmarkToggle } from "@/components/bookmark/bookmark-toggle";
import type { ProphetBookmarkTarget } from "@/lib/tracks/track-status";
import { TrackLink, TrackTooltip } from "@/components/bookmark/track-tooltip";

export interface MarketBookmarkControlProps {
  slug: string;
  teamName: string;
}

export function MarketBookmarkControl({
  slug,
  teamName
}: MarketBookmarkControlProps) {
  const target: ProphetBookmarkTarget = {
    category: "team",
    slug: slug,
    teamName
  };

  return (
    <BookmarkToggle
      target={target}
      ariaLabel="Add to Track"
      trackedAriaLabel="Remove from Track"
      tooltip={
        <TrackTooltip>
          You subscribed will be listed in <TrackLink />, and team changes will
          be notified in time.
        </TrackTooltip>
      }
    />
  );
}
