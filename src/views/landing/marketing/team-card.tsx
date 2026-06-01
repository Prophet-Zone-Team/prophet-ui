import type { LandingTeamCard } from "@/types/landing";
import { LandingFlag } from "@/views/landing/primitives/landing-flag";

interface TeamCardProps {
  team: LandingTeamCard;
}

export function TeamCard({ team }: TeamCardProps) {
  const className = team.down ? "team-card down" : "team-card";

  return (
    <article className={className}>
      <span className="rank">{team.rank}</span>
      <div className="team-name">
        <LandingFlag flag={team.flag} flagKind={team.flagKind} />
        {team.name}
      </div>
      <div className="team-value">
        <span className="percentage">{team.probability}</span>
        <span className={team.down ? "delta down" : "delta"}>{team.delta}</span>
      </div>
    </article>
  );
}
