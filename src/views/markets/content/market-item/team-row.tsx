import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";
import type { MarketItemTeam } from "@/views/markets/content/market-item/types";

export function TeamRow({
  team,
  flagSize = "sm"
}: {
  team: MarketItemTeam;
  flagSize?: "sm" | "md";
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <TeamFlag
        code={team.code}
        name={team.name}
        logoUrl={team.logoUrl}
        className={cn(
          "shrink-0 rounded-[2px] drop-shadow-[0_0_2px_rgba(0,0,0,0.2)]",
          flagSize === "md" ? "h-8 w-8 text-[32px]" : "h-6 w-6 text-[24px]"
        )}
      />
      <span className="truncate text-[16px] font-[500] leading-[20px] text-black">
        {team.name}
      </span>
    </div>
  );
}
