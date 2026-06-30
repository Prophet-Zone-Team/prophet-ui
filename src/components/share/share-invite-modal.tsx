"use client";

import {
  RefObject,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { X } from "lucide-react";

import { useDevice } from "@/hooks/common/use-device";
import { cn } from "@/lib/cn";
import { FundingResponsiveOverlay } from "@/views/portfolio/shared/funding-responsive-overlay";
import { ReferralInviteActions } from "@/views/referral/referral-invite-actions";
import type { ShareImageCacheKey } from "@/views/referral/referral-invite-actions";
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
  header?: ReactNode;
  children: ReactElement<{
    ref?: Ref<HTMLDivElement>;
    onBackgroundReady?: () => void;
  }>;
  downloadFilename?: string;
  shareCardReady: boolean;
  cardRef: RefObject<HTMLDivElement | null>;
  shareImageUploadMode: "cache" | "always";
  shareImageCacheKey?: ShareImageCacheKey;
  modalShellClass?: string;
  shareTweetText?: string;
  actionsRef?: RefObject<{
    handleTwitter: () => void;
    handleTelegram: () => void;
    handleDownload: () => void;
    handleCopyLink: () => void;
  }>;
  content?: any;
  actionsList?: ("x" | "telegram" | "download" | "copy")[];
};

export function ShareInviteModal({
  open,
  onClose,
  ariaLabel,
  header,
  linkPrefix,
  referralCode,
  fullLink,
  children,
  downloadFilename,
  shareCardReady,
  cardRef,
  shareImageUploadMode,
  shareImageCacheKey,
  modalShellClass,
  shareTweetText,
  actionsRef,
  content,
  actionsList,
}: ShareInviteModalProps) {
  const isMobile = useDevice();

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
          modalShellClass,
        )}
      >
        {isMobile ? (
          <button
            type="button"
            className="absolute right-0 top-0 z-10 inline-flex size-8 items-center justify-center rounded-lg bg-prophet-panel text-[#18110F] transition-colors hover:bg-[#fafbfc]"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : null}

        {
          !!header && (
            <div className="absolute left-1 md:left-3 top-1 md:top-3 z-10">
              {header}
            </div>
          )
        }

        <div className="flex flex-col gap-5">
          {children}

          {
            !!content ? content : (
              <>
                <ReferralInviteLinkRow
                  linkPrefix={linkPrefix}
                  referralCode={referralCode}
                  fullLink={fullLink}
                />

                <ReferralInviteActions
                  list={actionsList}
                  ref={actionsRef}
                  fullLink={fullLink}
                  shareCardRef={cardRef}
                  shareCardReady={shareCardReady}
                  shareImageUploadMode={shareImageUploadMode}
                  shareImageCacheKey={shareImageCacheKey}
                  downloadFilename={downloadFilename}
                  shareTweetText={shareTweetText}
                />
              </>
            )
          }

        </div>
      </div>
    </FundingResponsiveOverlay>
  );
}
