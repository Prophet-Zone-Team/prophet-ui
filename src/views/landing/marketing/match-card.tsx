import type { LandingMatch } from "@/types/landing";
import { LandingFlag } from "@/views/landing/primitives/landing-flag";

interface MatchCardProps {
  match: LandingMatch;
}

export function MatchCard({ match }: MatchCardProps) {
  return (
    <article className="match-card">
      <div className="match-teams">
        <div className="match-team">
          <LandingFlag flag={match.homeFlag} flagKind={match.homeFlagKind} />
          {match.home}
        </div>
        <span className="versus">vs</span>
        <div className="match-team">
          <LandingFlag flag={match.awayFlag} flagKind={match.awayFlagKind} />
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
