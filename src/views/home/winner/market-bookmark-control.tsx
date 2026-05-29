"use client";

import {
  BookmarkToggle,
  type ProphetBookmarkTarget
} from "@/components/bookmark/bookmark-toggle";
import { TrackLink, TrackTooltip } from "@/components/bookmark/track-tooltip";
import { worldCupTeams } from "@/data/teams/world-cup-teams";

export interface MarketBookmarkControlProps {
  slug: string;
  teamName: string;
}

function resolveTeamName(teamId: string): string {
  return worldCupTeams.find((team) => team.id === teamId)?.name ?? teamId;
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
