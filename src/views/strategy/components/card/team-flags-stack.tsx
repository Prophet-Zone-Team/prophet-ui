import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";

export type StrategyCardTeamRef = {
  code?: string;
  name?: string;
  logoUrl?: string;
};

export type StrategyTeamFlagsStackProps = {
  teams: StrategyCardTeamRef[];
  className?: string;
  maxVisible?: number;
};

const flagClassName =
  "h-[26px] text-[26px] shrink-0 rounded-[4px] border border-white shadow-[0_0_2px_rgba(0,0,0,0.2)] object-cover";

export function StrategyTeamFlagsStack({
  teams,
  className
}: StrategyTeamFlagsStackProps) {
  return (
    <div
      className={cn("flex items-center")}
      aria-label={`${teams.length} teams`}
    >
      <div className={cn("text-[26px] font-[500] mr-[10px]", className)}>
        {teams.length}
      </div>
      {teams.map((team, index) => (
        <TeamFlag
          key={team.code ?? team.name ?? index}
          code={team.code}
          name={team.name}
          logoUrl={team.logoUrl}
          fallback={false}
          className={cn(flagClassName, index > 0 && "-ml-2")}
        />
      ))}
    </div>
  );
}
