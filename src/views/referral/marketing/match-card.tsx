import type { ReferralMatch } from "@/types/referral";
import { ReferralFlag } from "@/views/referral/primitives/referral-flag";

interface MatchCardProps {
  match: ReferralMatch;
}

export function MatchCard({ match }: MatchCardProps) {
  return (
    <article className="match-card">
      <div className="match-teams">
        <div className="match-team">
          <ReferralFlag flag={match.homeFlag} flagKind={match.homeFlagKind} />
          {match.home}
        </div>
        <span className="versus">vs</span>
        <div className="match-team">
          <ReferralFlag flag={match.awayFlag} flagKind={match.awayFlagKind} />
          {match.away}
        </div>
        <span className="arrow">→</span>
      </div>
      <div className="match-time">{match.time}</div>
      <div className="odds">
        {match.odds.map((odd) => (
          <div key={odd.label} className="odd">
            <strong>{odd.probability}</strong>
            <span>{odd.label}</span>
            <small>{odd.price}</small>
          </div>
        ))}
      </div>
    </article>
  );
}
