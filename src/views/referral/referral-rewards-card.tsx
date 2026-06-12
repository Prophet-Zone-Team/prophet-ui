"use client";

import { useTranslations } from "next-intl";

import type { ReferralRewards } from "@/types/referral";

import {
  referralRewardsAmountClass,
  referralRewardsCardClass,
  referralRewardsClaimLineClass,
  referralRewardsCurrencyClass,
  referralRewardsHighlightClass,
  referralRewardsLabelClass,
} from "./referral-ui";

export type ReferralRewardsCardProps = {
  rewards: ReferralRewards;
};

export function ReferralRewardsCard({ rewards }: ReferralRewardsCardProps) {
  const t = useTranslations("referral");

  return (
    <section
      className={referralRewardsCardClass}
      aria-label={t("yourTotalRewards")}
    >
      <div className="relative z-10 flex h-full flex-col justify-between p-6 md:p-8 bg-[url('/referral/rewards-card-bg.png')] bg-no-repeat bg-[length:auto_80%] bg-[position:right_50px_center]">
        <p className={referralRewardsLabelClass}>{t("yourTotalRewards")}</p>

        <div className="flex flex-wrap items-end gap-2">
          <span className={referralRewardsAmountClass}>
            {rewards.totalRewardsUsdc}
          </span>
          <span className={referralRewardsCurrencyClass}>{t("usdc")}</span>
        </div>

        <p className={referralRewardsClaimLineClass}>
          {t.rich("toBeClaimed", {
            amount: rewards.claimableUsdc,
            highlight: (chunks) => (
              <span className={referralRewardsHighlightClass}>{chunks}</span>
            ),
          })}
        </p>
      </div>
    </section>
  );
}
