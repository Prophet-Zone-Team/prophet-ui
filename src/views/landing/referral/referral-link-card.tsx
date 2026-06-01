import { LinkIcon } from "@/views/landing/landing-icons";

interface ReferralLinkCardProps {
  referralLink: string;
}

export function ReferralLinkCard({ referralLink }: ReferralLinkCardProps) {
  return (
    <section className="referral-panel referral-link-card" aria-labelledby="referral-link-title">
      <h2 className="referral-section-title" id="referral-link-title">
        Your Referral Link
      </h2>
      <p className="referral-helper">
        Share your link and earn rewards when users trade on Prophet.
      </p>
      <div className="referral-link-row">
        <span className="referral-link-icon" aria-hidden="true">
          <LinkIcon />
        </span>
        <code>{referralLink}</code>
        <button type="button" className="copy-button">
          Copy Link
        </button>
      </div>
    </section>
  );
}
