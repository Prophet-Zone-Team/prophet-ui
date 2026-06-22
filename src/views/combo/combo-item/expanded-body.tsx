import { ComboOddsButton } from "@/views/combo/combo-item/combo-odds-button";
import { OddsSection } from "@/views/combo/combo-item/odds-section";
import type { ExpandedBodyProps } from "@/views/combo/combo-item/types";

const expandedOddsRowClassName = "flex flex-wrap gap-2";

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
        <div className={expandedOddsRowClassName}>
          {moneylineOdds.map((option) => (
            <ComboOddsButton
              key={option.id}
              option={option}
              selected={isOptionSelected(option.id)}
              wide
              onClick={() => onSelectOdds?.(option)}
            />
          ))}
        </div>
      </OddsSection>

      {halftimeOdds.length ? (
        <OddsSection title="Halftime">
          <div className={expandedOddsRowClassName}>
            {halftimeOdds.map((option) => (
              <ComboOddsButton
                key={option.id}
                option={option}
                selected={isOptionSelected(option.id)}
                wide
                onClick={() => onSelectOdds?.(option)}
              />
            ))}
          </div>
        </OddsSection>
      ) : null}

      {spreadOdds.length ? (
        <OddsSection title="Spreads">
          <div className={expandedOddsRowClassName}>
            {spreadOdds.map((option) => (
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

      {topScoreOdds.length ? (
        <OddsSection title="Top Scores">
          <div className={expandedOddsRowClassName}>
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
          <div className={expandedOddsRowClassName}>
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
