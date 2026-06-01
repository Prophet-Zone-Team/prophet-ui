import { Fragment } from "react";

import type { ReferralFormulaPart } from "@/types/referral";

import {
  referralEarnCardClass,
  referralEarnFootClass,
  referralEarnFormulaClass,
  referralEarnLinkClass,
  referralFormulaMarkClass,
  referralFormulaPartLabelClass,
  referralFormulaPartValueClass,
  referralHelperClass,
  referralSectionTitleClass,
} from "./referral-ui";

interface ReferralEarnProps {
  formula: ReferralFormulaPart[];
  footnote: string;
}

export function ReferralEarn({ formula, footnote }: ReferralEarnProps) {
  const marks = ["x", "x", "="] as const;

  return (
    <section className={referralEarnCardClass} aria-labelledby="earn-title">
      <h2 className={referralSectionTitleClass} id="earn-title">
        How You Earn
      </h2>
      <p className={referralHelperClass}>
        You earn a percentage of Prophet&apos;s actual revenue from your referred users&apos;
        completed orders.
      </p>
      <div className={referralEarnFormulaClass} aria-label="Reward calculation example">
        {formula.map((part, index) => (
          <Fragment key={part.label}>
            {index > 0 ? <div className={referralFormulaMarkClass}>{marks[index - 1]}</div> : null}
            <div>
              <span className={referralFormulaPartLabelClass}>{part.label}</span>
              <strong className={referralFormulaPartValueClass}>{part.value}</strong>
            </div>
          </Fragment>
        ))}
      </div>
      <div className={referralEarnFootClass}>
        <span>{footnote}</span>
        <a className={referralEarnLinkClass} href="/referral">
          Learn more
        </a>
      </div>
    </section>
  );
}
