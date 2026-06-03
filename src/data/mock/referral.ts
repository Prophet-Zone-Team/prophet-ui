import type { ReferralContent, ReferralPageContent } from "@/types/referral";

import { referralActivityRowsMock } from "./referral-activity-rows";
import { referralMarketingMock } from "./referral-marketing";

const referralFilledMock: ReferralContent = {
  rewards: {
    totalRewardsUsdc: "25.23",
    claimableUsdc: "10.56",
  },
  kickback: {
    ratePercent: "10%",
    description:
      "You earn a percentage of Prophet's actual revenue from your referred users' completed orders.",
    linkPrefix: "prophet.zone/?r=",
    referralCode: "aabbcc",
    fullLink: "https://prophet.zone/?r=aabbcc",
  },
  summary: {
    myReferrals: "12",
    totalVolume: "$25,231.90",
    myEarnings: "$25.23",
    toBeClaimed: "$10.56",
    canClaim: true,
  },
  activityRows: referralActivityRowsMock,
  activityTotalCount: 30,
};

export const referralContentEmptyMock: ReferralContent = {
  rewards: {
    totalRewardsUsdc: "0.00",
    claimableUsdc: "0.00",
  },
  kickback: {
    ratePercent: "10%",
    description:
      "You earn a percentage of Prophet's actual revenue from your referred users' completed orders.",
    linkPrefix: "prophet.zone/?r=",
    referralCode: "aabbcc",
    fullLink: "https://prophet.zone/?r=aabbcc",
  },
  summary: {
    myReferrals: "0",
    totalVolume: "$0.00",
    myEarnings: "$0.00",
    toBeClaimed: "$0.00",
    canClaim: false,
  },
  activityRows: [],
  activityTotalCount: 0,
};

export const referralPageContent: ReferralPageContent = {
  referral: referralFilledMock,
  marketing: referralMarketingMock,
};

export const referralPageContentEmpty: ReferralPageContent = {
  referral: referralContentEmptyMock,
  marketing: referralMarketingMock,
};
