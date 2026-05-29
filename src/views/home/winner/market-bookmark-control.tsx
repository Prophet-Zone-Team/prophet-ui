"use client";

import { BookmarkToggle } from "@/components/bookmark/bookmark-toggle";
import type { ProphetBookmarkTarget } from "@/lib/tracks/track-status";
import { TrackLink, TrackTooltip } from "@/components/bookmark/track-tooltip";
import { findCuratedTeamById } from "@/data/teams/curated-team-list";

export interface MarketBookmarkControlProps {
  slug: string;
  teamName: string;
  onUntracked?: (target: ProphetBookmarkTarget) => void;
}

function resolveTeamName(teamId: string): string {
  return findCuratedTeamById(teamId)?.name ?? teamId;
}

export function MarketBookmarkControl({
  slug,
  teamName,
  onUntracked
}: MarketBookmarkControlProps) {
  const target: ProphetBookmarkTarget = {
    category: "team",
    slug: slug,
    teamName
  };

  return (
    <BookmarkToggle
      target={target}
      onUntracked={onUntracked}
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
