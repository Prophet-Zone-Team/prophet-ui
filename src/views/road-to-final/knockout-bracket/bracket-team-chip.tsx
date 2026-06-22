import type { WorldCup2026GroupTeam } from "@/data/world-cup-2026/groups";
import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";

import { TeamHoverTooltip } from "./team-hover-tooltip";

export type TeamSlotVisualState =
  | "empty"
  | "filled"
  | "winner"
  | "pathWinner"
  | "champion"
  | "loser";

const INNER_WINNER_SURFACE = { width: 62, height: 78 };
const FINAL_WINNER_SURFACE = { width: 84, height: 108 };

const EMPTY_PLACEHOLDER_CLASS =
  "border border-[#33375A] bg-[rgba(50,57,66,0.5)]";

function EmptyTeamSlot({ variant }: { variant: "inner" | "final" }) {
  const isFinal = variant === "final";
  const flagSize = isFinal ? 42 : 26;
  const gap = isFinal ? 18 : 14;

  return (
    <div
      className="relative flex h-full min-w-0 flex-1 items-center justify-center"
      aria-hidden
    >
      <div
        className="flex flex-col items-center"
        style={{ gap }}
      >
        <div
          className={cn("rounded-[6px]", EMPTY_PLACEHOLDER_CLASS)}
          style={{ width: flagSize, height: flagSize }}
        />
        <div
          className={cn("h-[10px] w-[26px] rounded-[6px]", EMPTY_PLACEHOLDER_CLASS)}
        />
      </div>
    </div>
  );
}

export function BracketTeamChip({
  team,
  visualState,
  disabled,
  onSelect,
  probabilityByTeamId,
  variant = "inner"
}: {
  team?: WorldCup2026GroupTeam;
  visualState: TeamSlotVisualState;
  disabled?: boolean;
  onSelect?: () => void;
  probabilityByTeamId?: Map<string, number>;
  variant?: "inner" | "final";
}) {
  const isFinal = variant === "final";
  const surface = isFinal ? FINAL_WINNER_SURFACE : INNER_WINNER_SURFACE;
  const flagClassName = isFinal
    ? "h-[42px] w-[42px] shrink-0 rounded-[6px] text-[42px]"
    : "h-[26px] w-[26px] shrink-0 rounded-[4px] text-[26px]";

  if (visualState === "empty" || !team) {
    return <EmptyTeamSlot variant={variant} />;
  }

  const isChampion = visualState === "champion";
  const isPathWinner = visualState === "pathWinner";
  const isWinner = visualState === "winner" || isChampion || isPathWinner;
  const isLoser = visualState === "loser";
  const hasPathGradient = isChampion || isPathWinner;
  const showWinnerSurface = isWinner;
  const contentGap = isFinal ? 14 : 8;

  const chip = (
    <button
      type="button"
      disabled={disabled || !onSelect}
      onClick={onSelect}
      className={cn(
        "relative flex h-full min-w-0 flex-1 items-center justify-center px-[2px] text-center transition-colors",
        onSelect && !disabled && "cursor-pointer hover:brightness-110",
        disabled && "cursor-not-allowed opacity-60"
      )}
      aria-pressed={isWinner}
    >
      {showWinnerSurface ? (
        <div
          className={cn(
            "absolute rounded-[8px]",
            hasPathGradient
              ? "[background:linear-gradient(180deg,#FFF_0%,#7BCA25_100%)]"
              : "border border-[#EBEBEB] bg-white"
          )}
          style={{
            width: surface.width,
            height: surface.height,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)"
          }}
          aria-hidden
        />
      ) : null}

      <div
        className="relative z-[1] flex flex-col items-center"
        style={{ gap: contentGap }}
      >
        <TeamFlag
          code={team.code}
          name={team.name}
          className={cn(flagClassName, isLoser && "opacity-50")}
        />
        <span
          className={cn(
            "text-[14px] font-medium leading-none",
            isWinner && "text-black",
            isLoser && "text-white/50",
            !isWinner && !isLoser && "text-white"
          )}
        >
          {team.code}
        </span>
      </div>
    </button>
  );

  if (isWinner || isLoser || visualState === "filled") {
    return (
      <TeamHoverTooltip
        team={team}
        winnerProbability={probabilityByTeamId?.get(team.id)}
      >
        {chip}
      </TeamHoverTooltip>
    );
  }

  return chip;
}
