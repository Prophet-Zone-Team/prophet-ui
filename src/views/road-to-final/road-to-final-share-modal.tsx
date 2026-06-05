"use client";

import { useMemo, useRef, useState } from "react";

import { ShareInviteModal } from "@/components/share/share-invite-modal";
import { ROAD_TO_FINAL_SHARE_CARD_DOWNLOAD_FILENAME } from "@/lib/road-to-final/share-card-config";
import { resolveShareInviteLink } from "@/lib/referral/share-link";
import type { ThirdPlaceAllocationOption } from "@/data/world-cup-2026/third-place-options";
import type { PathResult } from "@/types/market";
import type { ReferralKickback } from "@/types/referral";

import {
  buildShareCardChampion,
  buildShareCardStages,
} from "./lib/build-share-card-stages";
import type { GroupPlacements, KnockoutWinners } from "./types";
import { RoadToFinalShareCard } from "./road-to-final-share-card";

export type RoadToFinalShareModalProps = {
  open: boolean;
  onClose: () => void;
  teamId: string;
  championTeamId?: string;
  result?: PathResult;
  placements: GroupPlacements;
  knockoutWinners: KnockoutWinners;
  thirdPlaceOption?: ThirdPlaceAllocationOption;
  funderAddress?: string;
  kickback?: ReferralKickback;
};

export function RoadToFinalShareModal({
  open,
  onClose,
  teamId,
  championTeamId,
  result,
  placements,
  knockoutWinners,
  thirdPlaceOption,
  funderAddress,
  kickback,
}: RoadToFinalShareModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [shareCardReady, setShareCardReady] = useState(false);

  const inviteLink = useMemo(
    () => resolveShareInviteLink(kickback),
    [kickback],
  );

  const stages = useMemo(() => {
    if (!result) {
      return [];
    }

    return buildShareCardStages({
      teamId,
      result,
      placements,
      knockoutWinners,
      thirdPlaceOption,
    });
  }, [knockoutWinners, placements, result, teamId, thirdPlaceOption]);

  const champion = useMemo(
    () => buildShareCardChampion(championTeamId),
    [championTeamId],
  );

  return (
    <ShareInviteModal
      open={open}
      onClose={onClose}
      ariaLabel="Share simulation result"
      linkPrefix={inviteLink.linkPrefix}
      referralCode={inviteLink.referralCode}
      fullLink={inviteLink.fullLink}
      downloadFilename={ROAD_TO_FINAL_SHARE_CARD_DOWNLOAD_FILENAME}
      shareCardReady={shareCardReady}
      cardRef={cardRef}
    >
      <RoadToFinalShareCard
        ref={cardRef}
        stages={stages}
        champion={champion}
        fullLink={inviteLink.fullLink}
        displayLink={inviteLink.displayLink}
        funderAddress={funderAddress}
        onBackgroundReady={() => setShareCardReady(true)}
      />
    </ShareInviteModal>
  );
}
