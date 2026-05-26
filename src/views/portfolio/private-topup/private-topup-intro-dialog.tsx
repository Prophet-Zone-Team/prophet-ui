"use client";

import { useState } from "react";

import { Modal } from "@/components/ui/modal";
import { WalletAvatar } from "@/layout/header/wallet-avatar";
import { formatShortWallet } from "@/lib/team/detail-format";
import { PRIVATE_TOPUP_INTRO_MODAL_WIDTH } from "@/views/portfolio/private-topup/config";
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

const INTRO_DESCRIPTION =
  "Want to participate without exposing your onchain activity? Private Mode helps keep your funding activity separate from your connected wallet, so you can use Prophet with greater privacy.";

const INFO_BANNER_TEXT =
  "You can fund a private balance first, then withdraw only the amount you want to use on the site.";

export interface PrivateTopupIntroDialogProps {
  open: boolean;
  guideOpen?: boolean;
  walletAddress: string;
  onClose: () => void;
  onProceed: () => void;
  onOpenGuide: () => void;
  onChangeWallet: () => void;
}

export function PrivateTopupIntroDialog({
  open,
  guideOpen = false,
  walletAddress,
  onClose,
  onProceed,
  onOpenGuide,
  onChangeWallet,
}: PrivateTopupIntroDialogProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel="Private Topup"
      className={PRIVATE_TOPUP_INTRO_MODAL_WIDTH}
      overlayClassName="z-[60]"
      hideCloseButton
      overlayCloseable={!guideOpen}
    >
      <div
        className={`${privateTopupOnboardingCardClass} ${PRIVATE_TOPUP_INTRO_MODAL_WIDTH} min-h-[534px]`}
      >
        <div className="relative px-5 pb-5 pt-5">
          <button
            type="button"
            className="absolute left-5 top-5 border-0 bg-transparent p-0 text-[16px] font-[457] text-[#3168ff] transition-opacity hover:opacity-80"
            onClick={onOpenGuide}
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
            <h2 className="m-0 mt-4 text-center text-[26px] font-[556] leading-normal text-black">
              Private Topup
            </h2>
            <p className="m-0 mt-4 max-w-[416px] text-center text-[16px] font-[457] leading-normal text-black">
              {INTRO_DESCRIPTION}
            </p>
          </div>

          <div className={`${privateTopupIntroConnectedCardClass} relative mt-6 p-3`}>
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
                <WalletAvatar
                  address={walletAddress}
                  className="size-[34px]"
                />
                <div className="min-w-0">
                  <p className="m-0 text-[14px] font-[556] text-[#909090]">
                    Connected Account
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <p className="m-0 truncate text-[16px] font-[556] text-black">
                      {formatShortWallet(walletAddress)}
                    </p>
                    <button
                      type="button"
                      className="inline-flex shrink-0 border-0 bg-transparent p-0 transition-opacity hover:opacity-70"
                      aria-label={copied ? "Copied" : "Copy wallet address"}
                      onClick={() => void handleCopy()}
                    >
                      <img
                        src="/icons/icon-copy.svg"
                        alt=""
                        className="size-3"
                        aria-hidden
                      />
                    </button>
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

          <p className={`${privateTopupInfoBannerClass} mt-4`}>{INFO_BANNER_TEXT}</p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              className={privateTopupIntroFooterCancelClass}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className={privateTopupIntroFooterProceedClass}
              onClick={onProceed}
            >
              Proceed
              <PrivateTopupProceedChevron />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
