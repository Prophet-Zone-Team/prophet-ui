import { ComboOddsButton } from "@/views/combo/combo-item/combo-odds-button";
import { TeamRow } from "@/views/combo/combo-item/team-row";
import type { CollapsedBodyProps } from "@/views/combo/combo-item/types";

export function CollapsedBody({
  homeTeam,
  awayTeam,
  moneylineOdds,
  previewOdds,
  selectedOddsId,
  onSelectOdds
}: CollapsedBodyProps) {
  return (
    <div className="flex flex-col gap-4 px-4 pb-4 lg:flex-row lg:items-center lg:gap-6">
      <div className="flex min-w-0 flex-col gap-3 lg:w-[220px] lg:shrink-0">
        <TeamRow team={homeTeam} />
        <TeamRow team={awayTeam} />
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {moneylineOdds.map((option) => (
            <ComboOddsButton
              key={option.id}
              option={option}
              selected={selectedOddsId === option.id}
              wide
              onClick={() => onSelectOdds?.(option)}
            />
          ))}
        </div>

        {previewOdds.length ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {previewOdds.map((option) => (
              <ComboOddsButton
                key={option.id}
                option={option}
                selected={selectedOddsId === option.id}
                onClick={() => onSelectOdds?.(option)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
