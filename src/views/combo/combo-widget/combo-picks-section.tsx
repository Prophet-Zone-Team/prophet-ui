import { Info } from "lucide-react";

import { ComboLogo } from "./combo-logo";
import { ComboPickCard } from "./combo-pick-card";
import { formatComboMultiplierLabel, formatComboPicksLabel } from "./formatters";
import type { ComboPick, ComboPickOutcomeSide } from "./types";

export type ComboPicksSectionProps = {
  picks: ComboPick[];
  multiplier: number;
  onInfoClick?: () => void;
  onPickOutcomeChange?: (pickId: string, side: ComboPickOutcomeSide) => void;
  onPickSpreadChange?: (pickId: string, spread: string) => void;
  onRemovePick?: (pickId: string) => void;
};

export function ComboPicksSection({
  picks,
  multiplier,
  onInfoClick,
  onPickOutcomeChange,
  onPickSpreadChange,
  onRemovePick
}: ComboPicksSectionProps) {
  return (
    <div className="flex flex-col gap-3 px-4 pb-4 pt-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <ComboLogo />
          <span className="bg-[linear-gradient(270deg,#542099_0%,#8C35FF_100%)] bg-clip-text text-lg font-[600] leading-[23px] text-transparent">
            Combo
          </span>
          <button
            type="button"
            onClick={onInfoClick}
            className="inline-flex size-3.5 shrink-0 items-center justify-center text-[#909090] transition-opacity hover:opacity-70"
            aria-label="Combo info"
          >
            <Info className="size-3.5" strokeWidth={1.75} aria-hidden />
          </button>
        </div>

        <span className="inline-flex h-7 shrink-0 items-center rounded-[15px] bg-black px-3 text-sm font-[500] leading-[18px] text-white">
          {formatComboMultiplierLabel(multiplier)}
        </span>
      </div>

      <h2 className="m-0 text-base font-[500] leading-5 text-black">
        {formatComboPicksLabel(picks.length)}
      </h2>

      <div className="flex flex-col gap-2">
        {picks.map((pick) => (
          <ComboPickCard
            key={pick.id}
            pick={pick}
            onOutcomeChange={(side) => onPickOutcomeChange?.(pick.id, side)}
            onSpreadChange={(spread) => onPickSpreadChange?.(pick.id, spread)}
            onRemove={() => onRemovePick?.(pick.id)}
          />
        ))}
      </div>
    </div>
  );
}
