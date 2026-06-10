"use client";

import { ShareInviteModal } from "@/components/share/share-invite-modal";
import type { ReferralKickback } from "@/types/referral";

import { ReferralShareCard } from "./referral-share-card";
import { useRef, useState } from "react";

export type InviteFriendsModalProps = {
  open: boolean;
  onClose: () => void;
  kickback: ReferralKickback;
  funderAddress?: string;
};

export function InviteFriendsModal({
  open,
  onClose,
  kickback,
  funderAddress,
}: InviteFriendsModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [shareCardReady, setShareCardReady] = useState(false);

  return (
    <ShareInviteModal
      open={open}
      onClose={onClose}
      ariaLabel="Invite friends"
      linkPrefix={kickback.linkPrefix}
      referralCode={kickback.referralCode}
      fullLink={kickback.fullLink}
      shareCardReady={shareCardReady}
      cardRef={cardRef}
    >
      <ReferralShareCard
        ref={cardRef}
        fullLink={kickback.fullLink}
        funderAddress={funderAddress}
        onBackgroundReady={() => setShareCardReady(true)}
      />
    </ShareInviteModal>
  );
}
