import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";
import { isComboPickOutcomeToggleLocked } from "@/lib/combo/combo-pick-toggle";
import {
  resolveComboPickDisplayLabel,
  resolveComboPickDisplayTeam
} from "@/lib/combo/resolve-combo-pick-display-label";

import {
  comboInnerCardClass,
  comboInnerCardSolidClass,
  comboTitleTextClass
} from "@/views/combo/combo-ui";
import { RemovePickButton } from "./remove-pick-button";
import { SpreadSelector } from "./spread-selector";
import type { ComboPick, ComboPickOutcomeSide } from "./types";
import { YesNoToggle } from "./yes-no-toggle";

export type ComboPickCardProps = {
  pick: ComboPick;
  outcomeToggleDisabledTooltip?: string;
  onOutcomeChange?: (side: ComboPickOutcomeSide) => void;
  onSpreadChange?: (spread: string) => void;
  onTotalChange?: (total: string) => void;
  onRemove?: () => void;
};

export function ComboPickCard({
  pick,
  outcomeToggleDisabledTooltip,
  onOutcomeChange,
  onSpreadChange,
  onTotalChange,
  onRemove
}: ComboPickCardProps) {
  const isOutcomeToggleLocked = isComboPickOutcomeToggleLocked(pick);
  const isDrawMoneylinePick =
    pick.type === "moneyline" && pick.team.code.toUpperCase() === "DRAW";
  const displayTeam = resolveComboPickDisplayTeam(pick);

  return (
    <div className={comboInnerCardClass}>
      <div className={comboInnerCardSolidClass}>
        <div className="flex items-center gap-2">
          <p className={cn("m-0 min-w-0 flex-1 truncate text-sm font-[400] leading-[18px]", comboTitleTextClass)}>
            {pick.matchupLabel}
          </p>

          {pick.type === "moneyline" ? (
            isDrawMoneylinePick ? null : (
              <YesNoToggle
                value={pick.outcomeSide}
                disabled={isOutcomeToggleLocked}
                disabledTooltip={
                  isOutcomeToggleLocked
                    ? outcomeToggleDisabledTooltip
                    : undefined
                }
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
          {displayTeam ? (
            <TeamFlag
              code={displayTeam.code}
              name={displayTeam.name}
              logoUrl={displayTeam.logoUrl}
              className="h-6 w-6 shrink-0 rounded-[2px] drop-shadow-[0_0_2px_rgba(0,0,0,0.2)]"
            />
          ) : null}
          <span className={cn("truncate text-sm font-[500] leading-[18px]", comboTitleTextClass)}>
            {resolveComboPickDisplayLabel(pick)}
          </span>
        </div>
      </div>
    </div>
  );
}
