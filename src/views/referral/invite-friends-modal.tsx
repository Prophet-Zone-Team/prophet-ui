"use client";

import { ShareInviteModal } from "@/components/share/share-invite-modal";
import type { ReferralKickback } from "@/types/referral";

import { ReferralShareCard } from "./referral-share-card";

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
  return (
    <ShareInviteModal
      open={open}
      onClose={onClose}
      ariaLabel="Invite friends"
      linkPrefix={kickback.linkPrefix}
      referralCode={kickback.referralCode}
      fullLink={kickback.fullLink}
    >
      <ReferralShareCard
        fullLink={kickback.fullLink}
        funderAddress={funderAddress}
      />
    </ShareInviteModal>
  );
}
