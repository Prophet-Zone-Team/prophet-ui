import type { ReferralContent } from "@/types/referral";

import {
  referralBalanceIconClass,
  referralBalanceLabelClass,
  referralBalancePillClass,
  referralBalanceValueClass,
  referralHeroClass,
  referralHeroRightClass,
  referralHeroSubtitleClass,
  referralHeroTitleClass,
} from "./referral-ui";

interface ReferralHeroProps {
  referral: Pick<
    ReferralContent,
    "title" | "subtitle" | "note" | "balanceLabel" | "balanceValue"
  >;
}

export function ReferralHero({ referral }: ReferralHeroProps) {
  const noteLines = referral.note.split("\n");

  return (
    <div className={referralHeroClass}>
      <div>
        <h1 id="referral-title" className={referralHeroTitleClass}>
          {referral.title}
        </h1>
        <p className={referralHeroSubtitleClass}>{referral.subtitle}</p>
      </div>
      <div className={referralHeroRightClass}>
        <p className={referralHeroSubtitleClass}>
          {noteLines.map((line, index) => (
            <span key={line}>
              {line}
              {index < noteLines.length - 1 ? <br /> : null}
            </span>
          ))}
        </p>
        <div className={referralBalancePillClass} aria-label="USDC balance">
          <span className={referralBalanceIconClass} aria-hidden="true">
            $
          </span>
          <div>
            <span className={referralBalanceLabelClass}>{referral.balanceLabel}</span>
            <strong className={referralBalanceValueClass}>{referral.balanceValue}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
