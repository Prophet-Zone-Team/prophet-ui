import { ComboOddsButton } from "@/views/combo/combo-item/combo-odds-button";
import { TeamRow } from "@/views/combo/combo-item/team-row";
import type { CollapsedBodyProps } from "@/views/combo/combo-item/types";

export function CollapsedBody({
  homeTeam,
  awayTeam,
  moneylineOdds,
  previewOdds,
  selectedOddsId,
  onSelectOdds,
}: CollapsedBodyProps) {
  return (
    <div className="hidden flex-col gap-3 px-4 pb-4 sm:flex-row sm:items-center sm:gap-6 md:flex">
      <div className="flex w-full shrink-0 flex-col gap-2 sm:w-[220px] sm:gap-3">
        <TeamRow team={homeTeam} truncateName />
        <TeamRow team={awayTeam} truncateName />
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {moneylineOdds.map((option) => (
            <ComboOddsButton
              key={option.id}
              option={option}
              selected={selectedOddsId === option.id}
              wide
              compact
              onClick={() => onSelectOdds?.(option)}
            />
          ))}
        </div>

        {previewOdds.length ? (
          <div className="hidden grid-cols-2 gap-1.5 sm:grid sm:grid-cols-4 sm:gap-2">
            {previewOdds.map((option) => (
              <ComboOddsButton
                key={option.id}
                option={option}
                selected={selectedOddsId === option.id}
                compact
                onClick={() => onSelectOdds?.(option)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
