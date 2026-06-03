import Image from "next/image";

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
  return (
    <section
      className={referralRewardsCardClass}
      aria-label="Your total rewards"
    >
      <div className="relative z-10 flex h-full flex-col justify-between p-6 md:p-8 bg-[url('/referral/rewards-card-bg.png')] bg-no-repeat bg-[length:auto_80%] bg-[position:right_50px_center]">
        <p className={referralRewardsLabelClass}>Your total rewards</p>

        <div className="flex flex-wrap items-end gap-2">
          <span className={referralRewardsAmountClass}>
            {rewards.totalRewardsUsdc}
          </span>
          <span className={referralRewardsCurrencyClass}>USDC</span>
        </div>

        <p className={referralRewardsClaimLineClass}>
          <span className={referralRewardsHighlightClass}>
            {rewards.claimableUsdc} USDC
          </span>{" "}
          <span>to be </span>
          <span className={referralRewardsHighlightClass}>Claim</span>
        </p>
      </div>
    </section>
  );
}
