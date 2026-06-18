import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";
import type { ComboItemTeam } from "@/views/combo/combo-item/types";

export function TeamRow({
  team,
  flagSize = "sm",
  truncateName = false,
}: {
  team: ComboItemTeam;
  flagSize?: "sm" | "md";
  truncateName?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 pt-2">
      <TeamFlag
        code={team.code}
        name={team.name}
        logoUrl={team.logoUrl}
        className={cn(
          "shrink-0 rounded-[2px] drop-shadow-[0_0_2px_rgba(0,0,0,0.2)]",
          flagSize === "md" ? "h-8 w-8 text-[32px]" : "h-6 w-6 text-[24px]"
        )}
      />
      <span
        className={cn(
          "min-w-0 text-lg font-[500] leading-[23px] text-black",
          truncateName ? "truncate" : "whitespace-normal break-words"
        )}
      >
        {team.name}
      </span>
    </div>
  );
}
