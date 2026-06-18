import { ComboOddsButton } from "@/views/combo/combo-item/combo-odds-button";
import { OddsSection } from "@/views/combo/combo-item/odds-section";
import type { ExpandedBodyProps } from "@/views/combo/combo-item/types";

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
      </OddsSection>

      {spreadOdds.length ? (
        <OddsSection title="Spreads">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {spreadOdds.map((option) => (
              <ComboOddsButton
                key={option.id}
                option={option}
                selected={selectedOddsId === option.id}
                mutedLabel
                onClick={() => onSelectOdds?.(option)}
              />
            ))}
          </div>
        </OddsSection>
      ) : null}

      {topScoreOdds.length ? (
        <OddsSection title="Top Scores">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {topScoreOdds.map((option) => (
              <ComboOddsButton
                key={option.id}
                option={option}
                selected={selectedOddsId === option.id}
                onClick={() => onSelectOdds?.(option)}
              />
            ))}
          </div>
        </OddsSection>
      ) : null}
    </div>
  );
}
