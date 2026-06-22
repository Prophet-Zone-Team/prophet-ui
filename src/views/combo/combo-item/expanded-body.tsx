import { ComboOddsButton } from "@/views/combo/combo-item/combo-odds-button";
import { OddsSection } from "@/views/combo/combo-item/odds-section";
import type { ExpandedBodyProps } from "@/views/combo/combo-item/types";

const fullWidthOddsRowClassName = "grid grid-cols-3 gap-2";
const adaptiveOddsRowClassName = "flex flex-wrap gap-2";

export function ExpandedBody({
  moneylineOdds,
  halftimeOdds = [],
  spreadOdds,
  topScoreOdds,
  totalOdds = [],
  isOptionSelected,
  onSelectOdds,
}: ExpandedBodyProps) {
  return (
    <div className="pb-4">
      <OddsSection title="Moneyline">
        <div className={fullWidthOddsRowClassName}>
          {moneylineOdds.map((option) => (
            <ComboOddsButton
              key={option.id}
              option={option}
              selected={isOptionSelected(option.id)}
              fullWidth
              onClick={() => onSelectOdds?.(option)}
            />
          ))}
        </div>
      </OddsSection>

      {halftimeOdds.length ? (
        <OddsSection title="Halftime">
          <div className={fullWidthOddsRowClassName}>
            {halftimeOdds.map((option) => (
              <ComboOddsButton
                key={option.id}
                option={option}
                selected={isOptionSelected(option.id)}
                fullWidth
                onClick={() => onSelectOdds?.(option)}
              />
            ))}
          </div>
        </OddsSection>
      ) : null}

      {spreadOdds.length ? (
        <OddsSection title="Spreads">
          <div className={adaptiveOddsRowClassName}>
            {spreadOdds.map((option) => (
              <ComboOddsButton
                key={option.id}
                option={option}
                selected={isOptionSelected(option.id)}
                onClick={() => onSelectOdds?.(option)}
              />
            ))}
          </div>
        </OddsSection>
      ) : null}

      {topScoreOdds.length ? (
        <OddsSection title="Extra Score">
          <div className={adaptiveOddsRowClassName}>
            {topScoreOdds.map((option) => (
              <ComboOddsButton
                key={option.id}
                option={option}
                selected={isOptionSelected(option.id)}
                onClick={() => onSelectOdds?.(option)}
              />
            ))}
          </div>
        </OddsSection>
      ) : null}

      {totalOdds.length ? (
        <OddsSection title="Totals">
          <div className={adaptiveOddsRowClassName}>
            {totalOdds.map((option) => (
              <ComboOddsButton
                key={option.id}
                option={option}
                selected={isOptionSelected(option.id)}
                mutedLabel
                onClick={() => onSelectOdds?.(option)}
              />
            ))}
          </div>
        </OddsSection>
      ) : null}

    </div>
  );
}
