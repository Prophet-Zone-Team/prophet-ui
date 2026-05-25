import { TeamFlag } from "@/components/teams/team-flag";
import type { WorldCup2026GroupTeam } from "@/data/world-cup-2026/groups";
import { cn } from "@/lib/cn";

export function SeedSlot({
  active = false,
  label,
  seed,
  team
}: {
  active?: boolean;
  label: string;
  seed: string;
  team?: WorldCup2026GroupTeam;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-[6px] rounded-[6px] border px-[8px] py-[6px]",
        active
          ? "border-[#18110F] bg-[#F9FAFC]"
          : "border-[#EBEBEB] bg-white"
      )}
    >
      <span className="shrink-0 text-[10px] font-[300] text-[#909090]">
        {seed}
      </span>
      {team ? (
        <TeamFlag
          code={team.code}
          name={team.name}
          className="h-[18px] w-[18px] shrink-0 rounded-[4px] text-[18px]"
        />
      ) : (
        <span
          className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] bg-[#F3F4F6] text-[10px] text-[#909090]"
          aria-hidden
        >
          ?
        </span>
      )}
      <strong className="min-w-0 truncate text-[12px] font-[400] text-black">
        {label}
      </strong>
    </div>
  );
}
