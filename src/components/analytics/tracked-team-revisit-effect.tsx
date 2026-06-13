"use client";

import { useEffect, useRef } from "react";

import { trackTrackedTeamRevisited } from "@/lib/analytics/tracking";
import { resolveTrackStoreKeyFromTarget } from "@/lib/tracks/track-status";
import { useTracksStore } from "@/store/tracks-store";

type TrackedTeamRevisitEffectProps = {
  teamId: string;
  teamName: string;
  teamCode?: string;
  slug?: string;
  entrySource: string;
};

export function TrackedTeamRevisitEffect({
  teamId,
  teamName,
  teamCode,
  slug,
  entrySource
}: TrackedTeamRevisitEffectProps) {
  const reportedRef = useRef(false);
  const byKey = useTracksStore((state) => state.byKey);

  useEffect(() => {
    if (reportedRef.current) {
      return;
    }

    const key = resolveTrackStoreKeyFromTarget({
      category: "team",
      slug: slug ?? teamId,
      teamName
    });

    if (!byKey[key]) {
      return;
    }

    reportedRef.current = true;

    trackTrackedTeamRevisited({
      teamId,
      teamName,
      teamCode,
      entrySource
    });
  }, [byKey, entrySource, slug, teamCode, teamId, teamName]);

  return null;
}
