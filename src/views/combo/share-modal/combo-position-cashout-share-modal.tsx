"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { ShareInviteModal } from "@/components/share/share-invite-modal";
import {
  COMBO_CASHOUT_SHARE_CARD_DOWNLOAD_FILENAME,
} from "@/lib/combo/share-card-config";
import { resolveShareInviteLink } from "@/lib/referral/share-link";
import type { PortfolioComboPositionCard } from "@/lib/portfolio/combo-positions/types";
import type { ReferralKickback } from "@/types/referral";

import { ComboPositionCashoutShareCard } from "./combo-position-cashout-share-card";

export type ComboPositionCashoutShareModalProps = {
  open: boolean;
  onClose: () => void;
  combo: PortfolioComboPositionCard | null;
  funderAddress?: string;
  kickback?: ReferralKickback;
};

function resolveCashoutAmount(combo: PortfolioComboPositionCard | null): number {
  if (!combo) {
    return 0;
  }

  if (combo.cashoutAmount != null && combo.cashoutAmount > 0) {
    return combo.cashoutAmount;
  }

  return combo.toWinAmount;
}

export function ComboPositionCashoutShareModal({
  open,
  onClose,
  combo,
  funderAddress,
  kickback,
}: ComboPositionCashoutShareModalProps) {
  const t = useTranslations("portfolio");
  const cardRef = useRef<HTMLDivElement>(null);
  const [shareCardReady, setShareCardReady] = useState(false);
  const cashoutAmount = resolveCashoutAmount(combo);

  const inviteLink = useMemo(
    () => resolveShareInviteLink(kickback),
    [kickback],
  );

  useEffect(() => {
    setShareCardReady(false);
  }, [combo?.id, cashoutAmount, combo?.stakeAmount]);

  return (
    <ShareInviteModal
      open={open && combo != null}
      onClose={onClose}
      ariaLabel={t("comboCashoutShareAria")}
      linkPrefix={inviteLink.linkPrefix}
      referralCode={inviteLink.referralCode}
      fullLink={inviteLink.fullLink}
      downloadFilename={COMBO_CASHOUT_SHARE_CARD_DOWNLOAD_FILENAME}
      shareCardReady={shareCardReady}
      cardRef={cardRef}
      shareImageUploadMode="always"
      modalShellClass="md:w-[650px]"
      shareTweetText={t("comboShareTweetText")}
    >
      <ComboPositionCashoutShareCard
        ref={cardRef}
        combo={combo}
        stakeAmount={combo?.stakeAmount ?? 0}
        cashoutAmount={cashoutAmount}
        fullLink={inviteLink.fullLink}
        displayLink={inviteLink.displayLink}
        funderAddress={funderAddress}
        onBackgroundReady={() => setShareCardReady(true)}
      />
    </ShareInviteModal>
  );
}
