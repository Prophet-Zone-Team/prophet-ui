import { TeamFlag } from "@/components/teams/team-flag";
import { shouldShowComboPickTeamFlag } from "@/lib/combo/map-market-to-combo-item";

import { RemovePickButton } from "./remove-pick-button";
import { SpreadSelector } from "./spread-selector";
import type { ComboPick, ComboPickOutcomeSide } from "./types";
import { YesNoToggle } from "./yes-no-toggle";

export type ComboPickCardProps = {
  pick: ComboPick;
  onOutcomeChange?: (side: ComboPickOutcomeSide) => void;
  onSpreadChange?: (spread: string) => void;
  onRemove?: () => void;
};

export function ComboPickCard({
  pick,
  onOutcomeChange,
  onSpreadChange,
  onRemove
}: ComboPickCardProps) {
  return (
    <div className="rounded-xl bg-white/50 p-2.5">
      <div className="rounded-md border border-[#EBEBEB] bg-white px-3 py-2.5">
        <div className="flex items-center gap-2">
          <p className="m-0 min-w-0 flex-1 truncate text-sm font-[400] leading-[18px] text-black">
            {pick.matchupLabel}
          </p>

          {pick.type === "moneyline" ? (
            <YesNoToggle value={pick.outcomeSide} onChange={onOutcomeChange} />
          ) : (
            <SpreadSelector
              value={pick.spreadValue}
              options={pick.spreadOptions}
              onChange={onSpreadChange}
            />
          )}

          <RemovePickButton
            onClick={onRemove}
            label={`Remove ${pick.selectionLabel}`}
          />
        </div>

        <div className="mt-2 flex items-center gap-2">
          {shouldShowComboPickTeamFlag(pick.team) ? (
            <TeamFlag
              code={pick.team.code}
              name={pick.team.name}
              logoUrl={pick.team.logoUrl}
              className="h-6 w-6 shrink-0 rounded-[2px] drop-shadow-[0_0_2px_rgba(0,0,0,0.2)]"
            />
          ) : null}
          <span className="truncate text-sm font-[500] leading-[18px] text-black">
            {pick.type === "spread" ? pick.spreadValue : pick.selectionLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
