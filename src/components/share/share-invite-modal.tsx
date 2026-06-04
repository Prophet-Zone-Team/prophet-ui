"use client";

import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type Ref,
} from "react";
import { X } from "lucide-react";

import { useDevice } from "@/hooks/common/use-device";
import { cn } from "@/lib/cn";
import { FundingResponsiveOverlay } from "@/views/portfolio/shared/funding-responsive-overlay";
import { ReferralInviteActions } from "@/views/referral/referral-invite-actions";
import { ReferralInviteLinkRow } from "@/views/referral/referral-invite-link-row";

import {
  inviteModalMobileShellClass,
  inviteModalShellClass,
} from "./share-modal-ui";

export type ShareInviteLinkProps = {
  linkPrefix: string;
  referralCode: string;
  fullLink: string;
};

export type ShareInviteModalProps = ShareInviteLinkProps & {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  children: ReactElement<{
    ref?: Ref<HTMLDivElement>;
    onBackgroundReady?: () => void;
  }>;
  downloadFilename?: string;
};

export function ShareInviteModal({
  open,
  onClose,
  ariaLabel,
  linkPrefix,
  referralCode,
  fullLink,
  children,
  downloadFilename,
}: ShareInviteModalProps) {
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

  const shareCard = isValidElement(children)
    ? cloneElement(children, {
        ref: cardRef,
        onBackgroundReady: handleBackgroundReady,
      })
    : children;

  return (
    <FundingResponsiveOverlay
      open={open}
      onClose={onClose}
      ariaLabel={ariaLabel}
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
          {shareCard}

          <ReferralInviteLinkRow
            linkPrefix={linkPrefix}
            referralCode={referralCode}
            fullLink={fullLink}
          />

          <ReferralInviteActions
            fullLink={fullLink}
            shareCardRef={cardRef}
            shareCardReady={shareCardReady}
            downloadFilename={downloadFilename}
          />
        </div>
      </div>
    </FundingResponsiveOverlay>
  );
}
