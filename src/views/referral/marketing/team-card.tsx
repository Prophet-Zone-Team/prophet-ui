import type { ReferralTeamCard } from "@/types/referral";
import { ReferralFlag } from "@/views/referral/primitives/referral-flag";

interface TeamCardProps {
  team: ReferralTeamCard;
}

export function TeamCard({ team }: TeamCardProps) {
  const className = team.down ? "team-card down" : "team-card";

  return (
    <article className={className}>
      <span className="rank">{team.rank}</span>
      <div className="team-name">
        <ReferralFlag flag={team.flag} flagKind={team.flagKind} />
        {team.name}
      </div>
      <div className="team-value">
        <span className="percentage">{team.probability}</span>
        <span className={team.down ? "delta down" : "delta"}>{team.delta}</span>
      </div>
    </article>
  );
}
