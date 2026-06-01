import { Fragment } from "react";

import type { ReferralFormulaPart } from "@/types/landing";

interface ReferralEarnProps {
  formula: ReferralFormulaPart[];
  footnote: string;
}

export function ReferralEarn({ formula, footnote }: ReferralEarnProps) {
  const marks = ["x", "x", "="] as const;

  return (
    <section className="referral-panel earn-card" aria-labelledby="earn-title">
      <h2 className="referral-section-title" id="earn-title">
        How You Earn
      </h2>
      <p className="referral-helper">
        You earn a percentage of Prophet&apos;s actual revenue from your referred users&apos;
        completed orders.
      </p>
      <div className="earn-formula" aria-label="Reward calculation example">
        {formula.map((part, index) => (
          <Fragment key={part.label}>
            {index > 0 ? <div className="formula-mark">{marks[index - 1]}</div> : null}
            <div className="formula-part">
              <span>{part.label}</span>
              <strong>{part.value}</strong>
            </div>
          </Fragment>
        ))}
      </div>
      <div className="earn-foot">
        <span>{footnote}</span>
        <a href="/landing">Learn more</a>
      </div>
    </section>
  );
}
