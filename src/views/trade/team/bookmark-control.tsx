"use client";

import {
  BookmarkToggle,
  type ProphetBookmarkTarget
} from "@/components/bookmark/bookmark-toggle";
import { TrackLink, TrackTooltip } from "@/components/bookmark/track-tooltip";

export interface BookmarkControlProps {
  slug: string;
  teamName: string;
}

export function BookmarkControl({ slug, teamName }: BookmarkControlProps) {
  const target: ProphetBookmarkTarget = {
    category: "team",
    slug: slug,
    teamName
  };

  return (
    <BookmarkToggle
      target={target}
      ariaLabel={`Add ${teamName} to Track`}
      trackedAriaLabel={`Remove ${teamName} from Track`}
      tooltip={
        <TrackTooltip>
          You subscribed will be listed in <TrackLink />, and team changes will
          be notified in time.
        </TrackTooltip>
      }
    />
  );
}
