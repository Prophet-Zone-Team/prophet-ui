import { referralPageContent } from "@/data/mock/referral";

import { portfolioPageClass } from "@/views/portfolio/portfolio-ui";

import { ReferralShell } from "./referral-shell";

export function ReferralPage() {
  const { referral } = referralPageContent;

  return (
    <div className={portfolioPageClass}>
      <ReferralShell referral={referral} />
    </div>
  );
}
