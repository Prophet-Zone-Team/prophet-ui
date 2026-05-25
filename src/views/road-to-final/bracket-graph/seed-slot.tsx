import { TeamFlag } from "@/components/teams/team-flag";
import type { WorldCup2026GroupTeam } from "@/data/world-cup-2026/groups";
import { cn } from "@/lib/cn";

import {
  bracketSelectedClassName,
  bracketSelectedStyle
} from "./selection-styles";

export function SeedSlot({
  active = false,
  disabled = false,
  label,
  onClick,
  seed,
  selected = false,
  team
}: {
  active?: boolean;
  disabled?: boolean;
  label: string;
  onClick?: () => void;
  seed: string;
  selected?: boolean;
  team?: WorldCup2026GroupTeam;
}) {
  const highlighted = selected || active;
  const className = cn(
    "flex min-w-0 items-center gap-[6px] rounded-[6px] px-[8px] py-[6px] text-left",
    bracketSelectedClassName(highlighted),
    onClick &&
      !disabled &&
      "cursor-pointer transition-[border-color,box-shadow,background-color] hover:border-[#22C55E]",
    disabled && !highlighted && "cursor-not-allowed opacity-60"
  );
  const style = bracketSelectedStyle(highlighted);

  const content = (
    <>
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
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={cn(className, "w-full appearance-none outline-none")}
        disabled={disabled}
        aria-pressed={selected}
        style={style}
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={className} style={style}>
      {content}
    </div>
  );
}
