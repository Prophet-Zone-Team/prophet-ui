"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import { useDevice } from "@/hooks/common/use-device";
import { FundingResponsiveOverlay } from "@/views/portfolio/shared/funding-responsive-overlay";
import type { ReferralKickback } from "@/types/referral";
import { cn } from "@/lib/cn";

import { ReferralInviteActions } from "./referral-invite-actions";
import { ReferralInviteLinkRow } from "./referral-invite-link-row";
import { ReferralShareCard } from "./referral-share-card";
import {
  inviteModalMobileShellClass,
  inviteModalShellClass,
} from "./referral-ui";

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
  const isMobile = useDevice();
  const cardRef = useRef<HTMLDivElement>(null);
  const [shareCardReady, setShareCardReady] = useState(false);

  const handleBackgroundReady = useCallback(() => {
    setShareCardReady(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setShareCardReady(false);
    }
  }, [open]);

  return (
    <FundingResponsiveOverlay
      open={open}
      onClose={onClose}
      ariaLabel="Invite friends"
      className="max-h-[calc(100vh-2rem)]"
      overlayClassName="z-[60]"
      closeButtonClassName="border-[0px]"
    >
      <div
        className={cn(
          inviteModalShellClass,
          "relative",
          inviteModalMobileShellClass,
        )}
      >
        {isMobile ? (
          <button
            type="button"
            className="absolute right-0 top-0 z-10 inline-flex size-8 items-center justify-center rounded-lg bg-white text-[#18110F] transition-colors hover:bg-[#fafbfc]"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : null}

        <div className="flex flex-col gap-5">
          <ReferralShareCard
            ref={cardRef}
            fullLink={kickback.fullLink}
            funderAddress={funderAddress}
            onBackgroundReady={handleBackgroundReady}
          />

          <ReferralInviteLinkRow
            linkPrefix={kickback.linkPrefix}
            referralCode={kickback.referralCode}
            fullLink={kickback.fullLink}
          />

          <ReferralInviteActions
            fullLink={kickback.fullLink}
            shareCardRef={cardRef}
            shareCardReady={shareCardReady}
          />
        </div>
      </div>
    </FundingResponsiveOverlay>
  );
}
