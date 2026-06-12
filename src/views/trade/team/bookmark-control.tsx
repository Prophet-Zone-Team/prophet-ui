"use client";

import { useTranslations } from "next-intl";

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
  const t = useTranslations("trade");
  const target: ProphetBookmarkTarget = {
    category: "team",
    slug: slug,
    teamName
  };

  return (
    <BookmarkToggle
      target={target}
      ariaLabel={t("addTeamToTrack", { teamName })}
      trackedAriaLabel={t("removeTeamFromTrack", { teamName })}
      tooltip={
        <TrackTooltip>
          {t.rich("trackTeamTooltip", {
            tracks: () => <TrackLink />
          })}
        </TrackTooltip>
      }
    />
  );
}
