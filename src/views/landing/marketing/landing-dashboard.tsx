import Link from "next/link";

import type { LandingMarketingContent } from "@/types/landing";
import { InfoIcon, LightningIcon } from "@/views/landing/landing-icons";

import { MoveCard } from "./move-card";
import { TeamCard } from "./team-card";

interface LandingDashboardProps {
  teams: LandingMarketingContent["teams"];
  moreTeamsCount: number;
  footnote: LandingMarketingContent["footnote"];
  movements: LandingMarketingContent["movements"];
}

export function LandingDashboard({
  teams,
  moreTeamsCount,
  footnote,
  movements,
}: LandingDashboardProps) {
  return (
    <section className="dashboard" aria-label="World Cup market dashboard">
      <div className="panel probability">
        <div className="panel-head">
          <h2 className="panel-title">
            World Cup Winner Probability
            <InfoIcon />
          </h2>
          <span className="live">Live</span>
        </div>

        <div className="teams-grid">
          {teams.map((team) => (
            <TeamCard key={team.rank} team={team} />
          ))}
          <article className="team-card more">
            <span>
              <span className="more-number">+{moreTeamsCount}</span>more teams
            </span>
          </article>
        </div>

        <div className="footnote">
          <span>{footnote.left}</span>
          <span>{footnote.right}</span>
        </div>
      </div>

      <aside className="panel movement" aria-label="Highlighted movement">
        <div className="panel-head">
          <h2 className="panel-title">
            <LightningIcon />
            Highlighted Movement
          </h2>
          <Link className="view-all" href="/feed">
            View all
          </Link>
        </div>
        <div className="movement-list">
          {movements.map((movement) => (
            <MoveCard key={movement.title} movement={movement} />
          ))}
        </div>
      </aside>
    </section>
  );
}
