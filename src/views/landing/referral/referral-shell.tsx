import type { LandingReferralContent } from "@/types/landing";

import { ReferralActivity } from "./referral-activity";
import { ReferralEarn } from "./referral-earn";
import { ReferralHero } from "./referral-hero";
import { ReferralLinkCard } from "./referral-link-card";
import { ReferralMetrics } from "./referral-metrics";
import { ReferralTabs } from "./referral-tabs";

interface ReferralShellProps {
  referral: LandingReferralContent;
}

export function ReferralShell({ referral }: ReferralShellProps) {
  return (
    <section className="referral-shell" aria-labelledby="referral-title">
      <ReferralHero referral={referral} />
      <ReferralTabs tabs={referral.tabs} />
      <ReferralLinkCard referralLink={referral.referralLink} />
      <ReferralMetrics metrics={referral.metrics} />
      <ReferralEarn formula={referral.formula} footnote={referral.earnFootnote} />
      <ReferralActivity rows={referral.activityRows} claimMeta={referral.claimMeta} />
    </section>
  );
}
