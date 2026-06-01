import type { LandingReferralContent } from "@/types/landing";

interface ReferralHeroProps {
  referral: Pick<
    LandingReferralContent,
    "title" | "subtitle" | "note" | "balanceLabel" | "balanceValue"
  >;
}

export function ReferralHero({ referral }: ReferralHeroProps) {
  const noteLines = referral.note.split("\n");

  return (
    <div className="referral-hero">
      <div className="referral-title">
        <h1 id="referral-title">{referral.title}</h1>
        <p>{referral.subtitle}</p>
      </div>
      <div className="referral-hero-right">
        <p className="referral-note">
          {noteLines.map((line, index) => (
            <span key={line}>
              {line}
              {index < noteLines.length - 1 ? <br /> : null}
            </span>
          ))}
        </p>
        <div className="balance-pill" aria-label="USDC balance">
          <span className="balance-icon" aria-hidden="true">
            $
          </span>
          <div>
            <span>{referral.balanceLabel}</span>
            <strong>{referral.balanceValue}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
