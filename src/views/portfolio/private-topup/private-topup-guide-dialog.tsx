"use client";

import {
  PRIVATE_MODE_STEPS,
  PRIVATE_TOPUP_GUIDE_MODAL_WIDTH,
} from "@/views/portfolio/private-topup/config";
import { PrivateModeStepCard } from "@/views/portfolio/private-topup/private-mode-step-card";
import { FundingResponsiveOverlay } from "@/views/portfolio/shared/funding-responsive-overlay";
import {
  PrivateTopupModalClose,
  PrivateTopupProceedChevron,
} from "@/views/portfolio/private-topup/private-topup-modal-close";
import {
  privateTopupChangeLinkClass,
  privateTopupGuideFooterCancelClass,
  privateTopupGuideFooterProceedClass,
  privateTopupOnboardingCardClass,
} from "@/views/portfolio/private-topup/private-topup-ui";

export interface PrivateTopupGuideDialogProps {
  open: boolean;
  onClose: () => void;
  onProceed: () => void;
  onChangeWallet: () => void;
}

export function PrivateTopupGuideDialog({
  open,
  onClose,
  onProceed,
  onChangeWallet,
}: PrivateTopupGuideDialogProps) {
  return (
    <FundingResponsiveOverlay
      open={open}
      onClose={onClose}
      ariaLabel="How to use Private Mode"
      className={PRIVATE_TOPUP_GUIDE_MODAL_WIDTH}
      hideCloseButton
      overlayCloseable
    >
      <div
        className={`${privateTopupOnboardingCardClass} w-full md:w-[966px] min-h-0 md:min-h-[527px]`}
      >
        <div className="relative px-5 pb-10 md:pb-5 pt-5">
          <PrivateTopupModalClose onClose={onClose} />

          <div className="flex flex-col items-center pt-2">
            <img
              src="/logos/logo-private.svg"
              alt="Private mode"
              className="h-[52px] w-[70px] object-contain"
            />
            <h2 className="m-0 mt-4 text-center text-[26px] font-[556] leading-normal text-black">
              How to use Private Mode
            </h2>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4">
            {PRIVATE_MODE_STEPS.map((item) => (
              <PrivateModeStepCard
                key={item.step}
                step={item.step}
                title={item.title}
                description={item.description}
                variant="modal"
                footer={
                  item.step === 1 ? (
                    <button
                      type="button"
                      className={`${privateTopupChangeLinkClass} mx-auto block border-0 bg-transparent p-0 text-[14px]`}
                      onClick={onChangeWallet}
                    >
                      Change Wallet
                    </button>
                  ) : undefined
                }
              />
            ))}
          </div>

          <div className="mt-6 flex flex-col items-stretch justify-between gap-3 md:flex-row md:items-center md:gap-4">
            <button
              type="button"
              className="border-0 bg-transparent p-0 text-left text-[14px] font-[457] text-black transition-opacity hover:opacity-70 md:text-center"
              onClick={onProceed}
            >
              Skip Guide
            </button>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                className={privateTopupGuideFooterCancelClass}
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className={privateTopupGuideFooterProceedClass}
                onClick={onProceed}
                disabled
              >
                Coming Soon
                <PrivateTopupProceedChevron />
              </button>
            </div>
          </div>
        </div>
      </div>
    </FundingResponsiveOverlay>
  );
}
