import { MarketOddsButton } from "@/views/markets/content/market-item/market-odds-button";
import { OddsSection } from "@/views/markets/content/market-item/odds-section";
import type { ExpandedBodyProps } from "@/views/markets/content/market-item/types";

export function ExpandedBody({
  moneylineOdds,
  spreadOdds,
  topScoreOdds,
  selectedOddsId,
  onSelectOdds
}: ExpandedBodyProps) {
  return (
    <div className="pb-4">
      <OddsSection title="Moneyline">
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
      </OddsSection>

      {spreadOdds.length ? (
        <OddsSection title="Spreads">
          <div className="flex flex-wrap gap-2">
            {spreadOdds.map((option, index) => (
              <MarketOddsButton
                key={option.id}
                option={option}
                selected={selectedOddsId === option.id}
                wide={index % 3 === 0}
                onClick={() => onSelectOdds?.(option)}
              />
            ))}
          </div>
        </OddsSection>
      ) : null}

      {topScoreOdds.length ? (
        <OddsSection title="Top Scores">
          <div className="flex flex-wrap gap-2">
            {topScoreOdds.map((option, index) => (
              <MarketOddsButton
                key={option.id}
                option={option}
                selected={selectedOddsId === option.id}
                wide={index % 3 === 0}
                onClick={() => onSelectOdds?.(option)}
              />
            ))}
          </div>
        </OddsSection>
      ) : null}
    </div>
  );
}
