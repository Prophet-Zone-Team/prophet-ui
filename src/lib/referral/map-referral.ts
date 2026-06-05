import Big from "big.js";

import { formatRelativeTime } from "@/lib/analytics/format-relative-time";
import { REFERRAL_KICKBACK_DESCRIPTION } from "@/lib/referral/config";
import { formatShortAddress } from "@/lib/referral/format-address";
import { buildReferralLinkParts } from "@/lib/referral/referral-link";
import type {
  ProphetReferral,
  ProphetReferralClaimSummary,
  ProphetReferralInviteItem
} from "@/types/prophet-api";
import type { ReferralActivityRow, ReferralContent } from "@/types/referral";
import { formatNumber } from "@/utils";

function formatKickbackRatePercent(kickbackRate: string): string {
  try {
    const percent = Big(kickbackRate).times(100);
    const trimmed = percent.mod(1).eq(0)
      ? percent.toFixed(0)
      : percent.toFixed(2).replace(/\.?0+$/, "");
    return `${trimmed}%`;
  } catch {
    return kickbackRate;
  }
}

function formatUsdAmount(value: string): string {
  return formatNumber(value, 2, true, { prefix: "$" }) as string;
}

export function mapClaimSummaryToProphetReferral(
  summary: ProphetReferralClaimSummary
): ProphetReferral {
  return { ...summary };
}

export function mapReferralInviteToRow(
  item: ProphetReferralInviteItem,
  page: number
): ReferralActivityRow {
  const timeSource = item.last_reward_at || item.bound_at;

  return {
    id: `${item.referred_user_id}-${page}`,
    user: formatShortAddress(item.referred_address),
    txId: item.referral_code ? item.referral_code : "—",
    time: formatRelativeTime(timeSource),
    market: item.event_title || "-",
    value: formatUsdAmount(item.total_referred_volume_usdc),
    earnings: formatUsdAmount(item.total_referral_earnings_usdc)
  };
}

export function mapProphetReferralToContent(
  referral: ProphetReferral
): Omit<ReferralContent, "activityRows" | "activityTotalCount"> {
  const linkParts = buildReferralLinkParts(referral.referral_code);
  const claimable = referral.claimable_balance_usdc;

  let canClaim = false;
  try {
    canClaim = Big(claimable).gt(0);
  } catch {
    canClaim = false;
  }

  return {
    rewards: {
      totalRewardsUsdc: formatNumber(
        referral.total_referral_earnings_usdc,
        2,
        true
      ) as string,
      claimableUsdc: formatNumber(claimable, 2, true) as string
    },
    kickback: {
      ratePercent: formatKickbackRatePercent(referral.kickback_rate),
      description: REFERRAL_KICKBACK_DESCRIPTION,
      ...linkParts
    },
    summary: {
      myReferrals: formatNumber(
        referral.referred_user_count,
        0,
        true
      ) as string,
      totalVolume: formatUsdAmount(referral.total_referred_volume_usdc),
      myEarnings: formatUsdAmount(referral.total_referral_earnings_usdc),
      toBeClaimed: formatUsdAmount(claimable),
      canClaim
    }
  };
}
