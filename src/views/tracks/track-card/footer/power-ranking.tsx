import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";

import { trackCardLabelClassName } from "../styles";
import type {
  TrackCardGamePowerRanking,
  TrackCardTeamPowerRanking
} from "../types";

export type TeamPowerRankingMetricProps = {
  variant: "team";
  powerRanking: TrackCardTeamPowerRanking;
  className?: string;
};

export type GamePowerRankingMetricProps = {
  variant: "game";
  powerRanking: TrackCardGamePowerRanking;
  className?: string;
};

export type PowerRankingMetricProps =
  | TeamPowerRankingMetricProps
  | GamePowerRankingMetricProps;

export function PowerRankingMetric(props: PowerRankingMetricProps) {
  if (props.variant === "game") {
    return <GamePowerRankingMetric {...props} />;
  }

  return <TeamPowerRankingMetric {...props} />;
}

function formatFifaRank(rank: number | null): string {
  return rank === null ? "-" : `#${rank}`;
}

function TeamPowerRankingMetric({
  powerRanking,
  className
}: TeamPowerRankingMetricProps) {
  return (
    <div className={cn("flex shrink-0 flex-col md:w-[15%]", className)}>
      <span className="text-[16px] font-[400] leading-[20px] text-black">
        {formatFifaRank(powerRanking.rank)}
      </span>
      <span className={trackCardLabelClassName}>Fifa Ranking</span>
    </div>
  );
}

function GamePowerRankingMetric({
  powerRanking,
  className
}: GamePowerRankingMetricProps) {
  return (
    <div className={cn("flex shrink-0 flex-col gap-1 md:w-[15%]", className)}>
      <div className="flex min-h-[20px] items-center gap-3">
        <PowerRankingTeamEntry
          code={powerRanking.home.team.code}
          name={powerRanking.home.team.name}
          rank={powerRanking.home.rank}
        />
        <PowerRankingTeamEntry
          code={powerRanking.away.team.code}
          name={powerRanking.away.team.name}
          rank={powerRanking.away.rank}
        />
      </div>
      <span className={trackCardLabelClassName}>Fifa Ranking</span>
    </div>
  );
}

function PowerRankingTeamEntry({
  code,
  name,
  rank
}: {
  code: string;
  name: string;
  rank: number | null;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <TeamFlag
        code={code}
        name={name}
        className="h-[16px] w-[16px] shrink-0 rounded-[2px] text-[16px]"
      />
      <span className="text-[16px] font-[400] leading-[20px] text-black">
        {formatFifaRank(rank)}
      </span>
    </span>
  );
}
