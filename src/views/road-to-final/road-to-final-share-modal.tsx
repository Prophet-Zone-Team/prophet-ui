"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { ShareInviteModal } from "@/components/share/share-invite-modal";
import { ROAD_TO_FINAL_SHARE_CARD_DOWNLOAD_FILENAME } from "@/lib/road-to-final/share-card-config";
import { resolveShareInviteLink } from "@/lib/referral/share-link";
import type { ThirdPlaceAllocationOption } from "@/data/world-cup-2026/third-place-options";
import type { PathResult } from "@/types/market";
import type { ReferralKickback } from "@/types/referral";

import {
  buildShareCardChampion,
  buildShareCardStages,
  resolveShareCardPathResult,
} from "./lib/build-share-card-stages";
import type { GroupPlacements, KnockoutWinners } from "./types";
import { RoadToFinalShareCard } from "./road-to-final-share-card";

export type RoadToFinalShareModalProps = {
  open: boolean;
  onClose: () => void;
  teamId: string;
  championTeamId?: string;
  advancingThirdGroups: string[];
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
  advancingThirdGroups,
  result,
  placements,
  knockoutWinners,
  thirdPlaceOption,
  funderAddress,
  kickback,
}: RoadToFinalShareModalProps) {
  const t = useTranslations("roadToFinal");
  const cardRef = useRef<HTMLDivElement>(null);
  const [shareCardReady, setShareCardReady] = useState(false);

  const inviteLink = useMemo(
    () => resolveShareInviteLink(kickback),
    [kickback],
  );

  const { simulationTeamId, simulationResult } = useMemo(
    () =>
      resolveShareCardPathResult({
        teamId,
        championTeamId,
        result,
        placements,
        advancingThirdGroups,
      }),
    [advancingThirdGroups, championTeamId, placements, result, teamId],
  );

  const stages = useMemo(() => {
    if (!simulationResult) {
      return [];
    }

    return buildShareCardStages({
      teamId: simulationTeamId,
      result: simulationResult,
      placements,
      knockoutWinners,
      thirdPlaceOption,
    });
  }, [
    knockoutWinners,
    placements,
    simulationResult,
    simulationTeamId,
    thirdPlaceOption,
  ]);

  const champion = useMemo(
    () => buildShareCardChampion(championTeamId),
    [championTeamId],
  );

  useEffect(() => {
    setShareCardReady(false);
  }, [champion, stages]);

  return (
    <ShareInviteModal
      open={open}
      onClose={onClose}
      ariaLabel={t("shareSimulationResultAria")}
      linkPrefix={inviteLink.linkPrefix}
      referralCode={inviteLink.referralCode}
      fullLink={inviteLink.fullLink}
      downloadFilename={ROAD_TO_FINAL_SHARE_CARD_DOWNLOAD_FILENAME}
      shareCardReady={shareCardReady}
      cardRef={cardRef}
      shareImageUploadMode="always"
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
