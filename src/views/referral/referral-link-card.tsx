import { CopyLinkIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { portfolioActionButtonClass } from "@/views/portfolio/portfolio-ui";

import {
  referralHelperClass,
  referralLinkCardClass,
  referralLinkCodeClass,
  referralLinkRowClass,
  referralMetricIconClass,
  referralSectionTitleClass,
} from "./referral-ui";

interface ReferralLinkCardProps {
  referralLink: string;
}

export function ReferralLinkCard({ referralLink }: ReferralLinkCardProps) {
  return (
    <section className={referralLinkCardClass} aria-labelledby="referral-link-title">
      <h2 className={referralSectionTitleClass} id="referral-link-title">
        Your Referral Link
      </h2>
      <p className={referralHelperClass}>
        Share your link and earn rewards when users trade on Prophet.
      </p>
      <div className={referralLinkRowClass}>
        <span className={referralMetricIconClass} aria-hidden="true">
          <CopyLinkIcon className="size-[18px] text-white" />
        </span>
        <code className={referralLinkCodeClass}>{referralLink}</code>
        <button
          type="button"
          className={cn(portfolioActionButtonClass, "h-[38px] min-w-[118px] text-[13px]")}
        >
          Copy Link
        </button>
      </div>
    </section>
  );
}
