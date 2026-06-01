import Link from "next/link";

import type { LandingMatch } from "@/types/landing";

import { MatchCard } from "./match-card";

interface LandingMatchesProps {
  matches: LandingMatch[];
}

export function LandingMatches({ matches }: LandingMatchesProps) {
  return (
    <section className="panel matches" aria-labelledby="matches-title">
      <div className="section-head">
        <h2 id="matches-title">Upcoming Matches</h2>
        <Link className="matches-link" href="/fifa/matches">
          View all matches <span aria-hidden="true">›</span>
        </Link>
      </div>
      <div className="match-grid">
        {matches.map((match) => (
          <MatchCard key={`${match.home}-${match.away}`} match={match} />
        ))}
      </div>
    </section>
  );
}
