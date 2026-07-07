import { cn } from "@/lib/cn";
import {
  comboMultiplierBadgeClass,
  comboSkeletonClass,
  comboTitleTextClass
} from "@/views/combo/combo-ui";

import { ComboLogo } from "./combo-logo";
import { ComboPickCard } from "./combo-pick-card";
import { formatComboMultiplierLabel, formatComboPicksLabel } from "./formatters";
import type { ComboPick, ComboPickOutcomeSide } from "./types";

export type ComboPicksSectionProps = {
  picks: ComboPick[];
  multiplier: number;
  isQuoteLoading?: boolean;
  outcomeToggleDisabledTooltip?: string;
  onInfoClick?: () => void;
  onPickOutcomeChange?: (pickId: string, side: ComboPickOutcomeSide) => void;
  onPickSpreadChange?: (pickId: string, spread: string) => void;
  onPickTotalChange?: (pickId: string, total: string) => void;
  onRemovePick?: (pickId: string) => void;
};

export function ComboPicksSection({
  picks,
  multiplier,
  isQuoteLoading = false,
  outcomeToggleDisabledTooltip,
  onInfoClick,
  onPickOutcomeChange,
  onPickSpreadChange,
  onPickTotalChange,
  onRemovePick
}: ComboPicksSectionProps) {
  return (
    <div className="flex flex-col gap-3 px-3 pb-3 pt-3 sm:px-4 sm:pb-4 sm:pt-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <ComboLogo />
          <span className="bg-[linear-gradient(270deg,#542099_0%,#8C35FF_100%)] bg-clip-text text-lg font-[600] leading-[23px] text-transparent">
            Combo
          </span>
        </div>

        {isQuoteLoading ? (
          <span
            className={comboSkeletonClass}
            aria-label="Loading multiplier"
          />
        ) : (
          <span className={comboMultiplierBadgeClass}>
            {formatComboMultiplierLabel(multiplier)}
          </span>
        )}
      </div>

      <h2 className={cn("m-0 text-base font-[500] leading-5", comboTitleTextClass)}>
        {formatComboPicksLabel(picks.length)}
      </h2>

      <div className="flex flex-col gap-2">
        {picks.map((pick) => (
          <ComboPickCard
            key={pick.id}
            pick={pick}
            outcomeToggleDisabledTooltip={outcomeToggleDisabledTooltip}
            onOutcomeChange={(side) => onPickOutcomeChange?.(pick.id, side)}
            onSpreadChange={(spread) => onPickSpreadChange?.(pick.id, spread)}
            onTotalChange={(total) => onPickTotalChange?.(pick.id, total)}
            onRemove={() => onRemovePick?.(pick.id)}
          />
        ))}
      </div>
    </div>
  );
}
