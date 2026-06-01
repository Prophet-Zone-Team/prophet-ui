import { TeamFlag } from "@/components/teams/team-flag";
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
  const displayLabel = label === "name" ? teamName : teamCode;

  return (
    <div className={cn("flex min-w-0 items-center gap-[8px]", className)}>
      <TeamFlag
        code={teamCode}
        name={teamName}
        className="h-[20px] w-[20px] shrink-0 rounded-[4px] text-[20px]"
      />
      <span
        className={cn(
          "truncate font-[457] text-black",
          textClassName ?? "text-[16px] leading-[17px]"
        )}
      >
        {displayLabel}
      </span>
    </div>
  );
}
