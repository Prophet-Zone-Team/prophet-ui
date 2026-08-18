import { MarketOddsButton } from "@/views/markets/content/market-item/market-odds-button";
import { TeamRow } from "@/views/markets/content/market-item/team-row";
import type { CollapsedBodyProps } from "@/views/markets/content/market-item/types";

export function CollapsedBody({
  homeTeam,
  awayTeam,
  moneylineOdds,
  previewOdds,
  selectedOddsId,
  onSelectOdds
}: CollapsedBodyProps) {
  return (
    <div className="flex flex-col gap-4 px-4 pb-4 lg:min-h-[120px] lg:flex-row lg:items-center lg:gap-6">
      <div className="flex min-w-0 flex-col gap-3 lg:w-[220px] lg:shrink-0">
        <TeamRow team={homeTeam} />
        <TeamRow team={awayTeam} />
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap gap-2">
          {moneylineOdds.map((option) => (
            <MarketOddsButton
              key={option.id}
              option={option}
              selected={selectedOddsId === option.id}
              wide
              onClick={() => onSelectOdds?.(option)}
            />
          ))}
        </div>

        {previewOdds.length ? (
          <div className="flex flex-wrap gap-2">
            {previewOdds.map((option, index) => (
              <MarketOddsButton
                key={option.id}
                option={option}
                selected={selectedOddsId === option.id}
                wide={index === 0}
                onClick={() => onSelectOdds?.(option)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
