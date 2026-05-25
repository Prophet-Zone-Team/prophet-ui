import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";

export type TeamInfoProps = {
  teamCode: string;
  teamName: string;
  className?: string;
};

export function TeamInfo({ teamCode, teamName, className }: TeamInfoProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-[6px]", className)}>
      <TeamFlag
        code={teamCode}
        name={teamName}
        className="h-[20px] w-[20px] shrink-0 rounded-[4px] text-[20px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
      />
      <span className="truncate text-[14px] font-[300] leading-[17px] text-black">
        {teamCode}
      </span>
    </div>
  );
}
