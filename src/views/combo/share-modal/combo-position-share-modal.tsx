"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { ShareInviteModal } from "@/components/share/share-invite-modal";
import {
  COMBO_SHARE_CARD_DOWNLOAD_FILENAME,
} from "@/lib/combo/share-card-config";
import { resolveShareInviteLink } from "@/lib/referral/share-link";
import type { PortfolioComboPositionCard } from "@/lib/portfolio/combo-positions/types";
import type { ReferralKickback } from "@/types/referral";

import { ComboPositionShareCard } from "./combo-position-share-card";

export type ComboPositionShareModalProps = {
  open: boolean;
  onClose: () => void;
  combo: PortfolioComboPositionCard | null;
  funderAddress?: string;
  kickback?: ReferralKickback;
};

export function ComboPositionShareModal({
  open,
  onClose,
  combo,
  funderAddress,
  kickback,
}: ComboPositionShareModalProps) {
  const t = useTranslations("portfolio");
  const cardRef = useRef<HTMLDivElement>(null);
  const [shareCardReady, setShareCardReady] = useState(false);

  const inviteLink = useMemo(
    () => resolveShareInviteLink(kickback),
    [kickback],
  );

  useEffect(() => {
    setShareCardReady(false);
  }, [combo?.id, combo?.picks.length, combo?.multiplier, combo?.stakeAmount, combo?.toWinAmount]);

  return (
    <ShareInviteModal
      open={open && combo != null}
      onClose={onClose}
      ariaLabel={t("comboShareAria")}
      linkPrefix={inviteLink.linkPrefix}
      referralCode={inviteLink.referralCode}
      fullLink={inviteLink.fullLink}
      downloadFilename={COMBO_SHARE_CARD_DOWNLOAD_FILENAME}
      shareCardReady={shareCardReady}
      cardRef={cardRef}
      shareImageUploadMode="always"
      modalShellClass="md:w-[650px]"
      shareTweetText={t("comboShareTweetText")}
    >
      <ComboPositionShareCard
        ref={cardRef}
        picks={combo?.picks ?? []}
        multiplier={combo?.multiplier ?? 0}
        stakeAmount={combo?.stakeAmount ?? 0}
        toWinAmount={combo?.toWinAmount ?? 0}
        fullLink={inviteLink.fullLink}
        displayLink={inviteLink.displayLink}
        funderAddress={funderAddress}
        onBackgroundReady={() => setShareCardReady(true)}
      />
    </ShareInviteModal>
  );
}
