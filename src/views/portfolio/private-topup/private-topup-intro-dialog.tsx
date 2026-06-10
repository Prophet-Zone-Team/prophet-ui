"use client";

import { CopyButton } from "@/components/feedback/copy-button";
import { WalletAvatar } from "@/layout/header/wallet-avatar";
import { formatShortWallet } from "@/lib/team/detail-format";
import { PRIVATE_TOPUP_INTRO_MODAL_WIDTH } from "@/views/portfolio/private-topup/config";
import { FundingResponsiveOverlay } from "@/views/portfolio/shared/funding-responsive-overlay";
import {
  PrivateTopupModalClose,
  PrivateTopupProceedChevron,
} from "@/views/portfolio/private-topup/private-topup-modal-close";
import {
  privateTopupChangeLinkClass,
  privateTopupInfoBannerClass,
  privateTopupIntroConnectedCardClass,
  privateTopupIntroFooterCancelClass,
  privateTopupIntroFooterProceedClass,
  privateTopupOnboardingCardClass,
  privateTopupWarningBannerClass,
} from "@/views/portfolio/private-topup/private-topup-ui";

export interface PrivateTopupIntroDialogProps {
  open: boolean;
  guideOpen?: boolean;
  walletAddress: string;
  proceeding?: boolean;
  error?: string;
  onClose: () => void;
  onProceed: () => void;
  onOpenGuide: () => void;
  onChangeWallet: () => void;
}

export function PrivateTopupIntroDialog({
  open,
  guideOpen = false,
  walletAddress,
  proceeding = false,
  error,
  onClose,
  onProceed,
  onOpenGuide,
  onChangeWallet,
}: PrivateTopupIntroDialogProps) {
  return (
    <FundingResponsiveOverlay
      open={open}
      onClose={onClose}
      ariaLabel="Private Topup"
      className={PRIVATE_TOPUP_INTRO_MODAL_WIDTH}
      hideCloseButton
      overlayCloseable={!guideOpen}
    >
      <div
        className={`${privateTopupOnboardingCardClass} w-full md:w-[472px] min-h-0 md:min-h-[534px]`}
      >
        <div className="relative px-5 pb-10 md:pb-5 pt-5">
          <button
            type="button"
            className="absolute left-5 top-5 border-0 bg-transparent p-0 text-[16px] font-[400] text-[#3168ff] transition-opacity hover:opacity-80"
            onClick={() => {
              // onClose();
              onOpenGuide();
            }}
          >
            How to use?
          </button>
          <PrivateTopupModalClose onClose={onClose} />

          <div className="flex flex-col items-center pt-6">
            <img
              src="/logos/logo-private.svg"
              alt="Private mode"
              className="h-[52px] w-[70px] object-contain"
            />
            <h2 className="m-0 mt-4 text-center text-[26px] font-[500] leading-normal text-black">
              Private Balance
            </h2>
            <p className="m-0 mt-4 max-w-[416px] text-center text-[16px] font-[400] leading-normal text-black">
              Trade on Prophet with stronger onchain privacy.
              <br />
              <br />
              For better privacy, make sure your connected wallet has no past
              activity linked to known wallets, exchanges, or your main account.
              You can also create a new wallet before using Private Top-Up.
            </p>
          </div>

          <div
            className={`${privateTopupIntroConnectedCardClass} relative mt-6 p-3`}
          >
            <div className={privateTopupWarningBannerClass}>
              <img
                src="/icons/icon-info.svg"
                alt=""
                className="size-3 shrink-0"
                aria-hidden
              />
              <span>Be sure that you are using your private wallet</span>
            </div>

            <div className="mt-3 flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <WalletAvatar address={walletAddress} className="size-[34px]" />
                <div className="min-w-0">
                  <p className="m-0 text-[14px] font-[500] text-[#909090]">
                    Connected Account
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <p className="m-0 truncate text-[16px] font-[500] text-black">
                      {formatShortWallet(walletAddress)}
                    </p>
                    <CopyButton
                      text={walletAddress}
                      ariaLabel="Copy wallet address"
                      className="inline-flex shrink-0 border-0 bg-transparent p-0 transition-opacity hover:opacity-70"
                    >
                      <img
                        src="/icons/icon-copy.svg"
                        alt=""
                        className="size-3"
                        aria-hidden
                      />
                    </CopyButton>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className={`${privateTopupChangeLinkClass} shrink-0 border-0 bg-transparent p-0 text-[14px]`}
                onClick={onChangeWallet}
              >
                Change Wallet
              </button>
            </div>
          </div>

          <p className={`${privateTopupInfoBannerClass} mt-4`}>
            Top up your private balance first, then withdraw only the amount you
            need to use on Prophet. Your funds always remain under your custody.
          </p>

          {error ? (
            <p className="mt-4 text-center text-[14px] font-[400] text-[#e5484d]">
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              className={privateTopupIntroFooterCancelClass}
              onClick={onClose}
              disabled={proceeding}
            >
              Cancel
            </button>
            <button
              type="button"
              className={privateTopupIntroFooterProceedClass}
              onClick={onProceed}
              disabled={proceeding}
            >
              {proceeding ? "Verifying…" : "Proceed"}
              <PrivateTopupProceedChevron />
            </button>
          </div>
        </div>
      </div>
    </FundingResponsiveOverlay>
  );
}
