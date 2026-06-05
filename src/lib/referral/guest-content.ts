import { REFERRAL_KICKBACK_DESCRIPTION } from "@/lib/referral/config";
import type { ReferralContent } from "@/types/referral";

export const referralGuestContent: Pick<
  ReferralContent,
  "rewards" | "kickback" | "summary"
> = {
  rewards: {
    totalRewardsUsdc: "0.00",
    claimableUsdc: "0.00",
  },
  kickback: {
    ratePercent: "0%",
    description: REFERRAL_KICKBACK_DESCRIPTION,
    linkPrefix: "",
    referralCode: "",
    fullLink: "",
  },
  summary: {
    myReferrals: "0",
    totalVolume: "$0.00",
    myEarnings: "$0.00",
    toBeClaimed: "$0.00",
    canClaim: false,
  },
};
