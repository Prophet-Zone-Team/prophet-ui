import { TeamFlag } from "@/components/teams/team-flag";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { cn } from "@/lib/cn";

export type TeamInfoProps = {
  teamCode: string;
  teamName: string;
  label?: "code" | "name";
  textClassName?: string;
  className?: string;
};

export function TeamInfo({
  teamCode,
  teamName,
  label = "code",
  textClassName,
  className
}: TeamInfoProps) {
  const localizedTeamName = useLocalizedTeamName(teamCode, teamName);
  const displayLabel = label === "name" ? localizedTeamName : teamCode;

  return (
    <div className={cn("flex min-w-0 items-center gap-[8px]", className)}>
      <TeamFlag
        code={teamCode}
        name={teamName}
        className="h-[20px] w-[20px] shrink-0 rounded-[4px] text-[20px]"
      />
      <span
        className={cn(
          "truncate font-[400] text-black",
          textClassName ?? "text-[12px] leading-[14px]"
        )}
      >
        {displayLabel}
      </span>
    </div>
  );
}
