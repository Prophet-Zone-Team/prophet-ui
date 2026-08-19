import { TeamFlag } from "@/components/teams/team-flag";
import { formatOutcomeMultiplier } from "@/lib/market/order-math";
import type { Team } from "@/types/market";

export type GameOutcomeRowProps = {
  team: Team;
  displayName: string;
  logoUrl?: string;
  probability: number;
  barColor: string;
};

function clampPercent(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.min(value, 100);
}

function formatPercentLabel(probability: number): string {
  if (!Number.isFinite(probability) || probability <= 0) {
    return "—";
  }

  return `${Math.round(probability)}%`;
}

function formatMultiplierLabel(probability: number): string {
  if (!Number.isFinite(probability) || probability <= 0) {
    return "—";
  }

  const multiplier = formatOutcomeMultiplier(probability / 100);
  return multiplier === "—" ? "—" : `${multiplier}x`;
}

export function GameOutcomeRow({
  team,
  displayName,
  logoUrl,
  probability,
  barColor
}: GameOutcomeRowProps) {
  const fillPercent = clampPercent(probability);

  return (
    <div className="flex min-w-0 items-center gap-4">
      <TeamFlag
        code={team.code}
        name={displayName}
        logoUrl={logoUrl ?? team.logoUrl}
        className="h-9 w-9 shrink-0 rounded-[2px] text-[36px] drop-shadow-[0_0_2px_rgba(0,0,0,0.2)]"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 md:max-w-[464px]">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <span className="min-w-0 truncate text-[16px] font-[500] leading-[20px] text-prophet-foreground">
            {displayName}
          </span>
          <div className="flex shrink-0 items-baseline gap-1.5">
            <span className="text-[12px] font-[400] leading-[15px] text-[#909090]">
              {formatMultiplierLabel(probability)}
            </span>
            <span className="w-[34px] text-right text-[16px] font-[500] leading-[20px] text-prophet-foreground">
              {formatPercentLabel(probability)}
            </span>
          </div>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-[4px] bg-[#D9D9D9]"
          aria-hidden
        >
          <div
            className="h-full"
            style={{ width: `${fillPercent}%`, backgroundColor: barColor }}
          />
        </div>
      </div>
    </div>
  );
}
