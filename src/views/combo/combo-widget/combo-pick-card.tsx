import { TeamFlag } from "@/components/teams/team-flag";
import { shouldShowComboPickTeamFlag } from "@/lib/combo/map-market-to-combo-item";

import { RemovePickButton } from "./remove-pick-button";
import { SpreadSelector } from "./spread-selector";
import type { ComboPick, ComboPickOutcomeSide } from "./types";
import { YesNoToggle } from "./yes-no-toggle";

function isDrawMoneylinePick(pick: ComboPick): boolean {
  return pick.type === "moneyline" && pick.team.code.toUpperCase() === "DRAW";
}

function isHalftimeMoneylinePick(pick: ComboPick): boolean {
  return pick.type === "moneyline" && /-halftime-result-/i.test(pick.id);
}

function resolvePickDisplayLabel(pick: ComboPick): string {
  if (pick.type === "spread") {
    return pick.spreadValue;
  }

  if (isHalftimeMoneylinePick(pick)) {
    return `Halftime: ${pick.selectionLabel}`;
  }

  if (isDrawMoneylinePick(pick)) {
    return pick.team.name;
  }

  return pick.selectionLabel;
}

export type ComboPickCardProps = {
  pick: ComboPick;
  onOutcomeChange?: (side: ComboPickOutcomeSide) => void;
  onSpreadChange?: (spread: string) => void;
  onTotalChange?: (total: string) => void;
  onRemove?: () => void;
};

export function ComboPickCard({
  pick,
  onOutcomeChange,
  onSpreadChange,
  onTotalChange,
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
            isDrawMoneylinePick(pick) ? null : (
              <YesNoToggle
                value={pick.outcomeSide}
                onChange={onOutcomeChange}
              />
            )
          ) : pick.type === "spread" ? (
            <SpreadSelector
              value={pick.spreadValue}
              options={pick.spreadOptions}
              onChange={onSpreadChange}
            />
          ) : (
            <>
              <SpreadSelector
                value={pick.totalValue}
                options={pick.totalOptions}
                onChange={onTotalChange}
                ariaLabel="Total line"
              />
              <YesNoToggle
                value={pick.outcomeSide}
                onChange={onOutcomeChange}
              />
            </>
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
            {resolvePickDisplayLabel(pick)}
          </span>
        </div>
      </div>
    </div>
  );
}
