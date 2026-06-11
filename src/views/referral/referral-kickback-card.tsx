"use client";

import { useTranslations } from "next-intl";

import type { ReferralKickback } from "@/types/referral";

import { ReferralLinkCopy } from "./referral-link-copy";
import {
  referralInviteButtonClass,
  referralKickbackCardClass,
  referralKickbackFooterClass,
  referralKickbackLinkBarClass,
} from "./referral-ui";
import { cn } from "@/lib/cn";

export type ReferralKickbackCardProps = {
  kickback: ReferralKickback;
  needsWallet?: boolean;
  loginInProgress?: boolean;
  onInviteFriends?: () => void;
  onConnectWallet?: () => void;
};

export function ReferralKickbackCard({
  kickback,
  needsWallet = false,
  loginInProgress = false,
  onInviteFriends,
  onConnectWallet,
}: ReferralKickbackCardProps) {
  const t = useTranslations("referral");

  return (
    <section
      className={referralKickbackCardClass}
      aria-label={t("referralKickbackAndLink")}
    >
      <div className="flex flex-1 flex-col px-6 pt-6">
        <div className="flex items-start justify-between gap-4">
          <span className="text-[14px] leading-[normal] text-[#909090]">
            {t("kickbackRate")}
          </span>
          <span className="text-[18px] font-medium leading-[normal] text-black">
            {kickback.ratePercent}
          </span>
        </div>
        <p className="mt-3 text-[14px] leading-[normal] text-[#909090]">
          {kickback.description}
        </p>
      </div>

      <div className={referralKickbackFooterClass}>
        <div className="relative z-10 flex flex-col gap-4">
          {needsWallet ? (
            <button
              type="button"
              className={cn(referralInviteButtonClass, "mt-6")}
              disabled={loginInProgress}
              onClick={onConnectWallet}
            >
              {loginInProgress ? t("connecting") : t("connectWallet")}
            </button>
          ) : (
            <>
              <div className={referralKickbackLinkBarClass}>
                <ReferralLinkCopy
                  linkPrefix={kickback.linkPrefix}
                  referralCode={kickback.referralCode}
                  fullLink={kickback.fullLink}
                  className="w-full"
                />
              </div>
              <button
                type="button"
                className={referralInviteButtonClass}
                onClick={onInviteFriends}
              >
                {t("inviteFriends")}
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
