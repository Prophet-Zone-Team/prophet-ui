import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";
import type { ComboItemTeam } from "@/views/combo/combo-item/types";

export function TeamRow({
  team,
  flagSize = "sm",
  truncateName = false,
  layout = "stacked"
}: {
  team: ComboItemTeam;
  flagSize?: "xs" | "sm" | "md";
  truncateName?: boolean;
  layout?: "stacked" | "inline";
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2",
        layout === "stacked" && "pt-2"
      )}
    >
      <TeamFlag
        code={team.code}
        name={team.name}
        logoUrl={team.logoUrl}
        className={cn(
          "shrink-0 rounded-[2px] drop-shadow-[0_0_2px_rgba(0,0,0,0.2)]",
          flagSize === "md"
            ? "h-8 w-8 text-[32px]"
            : flagSize === "xs"
              ? "h-5 w-5 text-[20px]"
              : "h-6 w-6 text-[24px]"
        )}
      />
      <span
        className={cn(
          "min-w-0 font-[500] text-prophet-foreground",
          flagSize === "xs"
            ? "text-base leading-5"
            : "text-base leading-[21px] sm:text-lg sm:leading-[23px]",
          truncateName ? "truncate" : "whitespace-normal break-words"
        )}
      >
        {team.name}
      </span>
    </div>
  );
}
