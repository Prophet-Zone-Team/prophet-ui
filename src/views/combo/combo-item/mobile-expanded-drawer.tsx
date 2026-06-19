import { ComboOddsButton } from "@/views/combo/combo-item/combo-odds-button";
import { MobileDrawerHeader } from "@/views/combo/combo-item/mobile-drawer-header";
import { MobileDrawerOddsSection } from "@/views/combo/combo-item/mobile-drawer-odds-section";
import type {
  ComboItemTeam,
  ComboOddsOption,
  ExpandedBodyProps
} from "@/views/combo/combo-item/types";

export type MobileExpandedDrawerProps = ExpandedBodyProps & {
  kickoffLabel: string;
  isLive?: boolean;
  homeTeam: ComboItemTeam;
  awayTeam: ComboItemTeam;
};

const moneylineGridClassName = "grid grid-cols-3 gap-1.5";
const threeColGridClassName = "grid grid-cols-3 gap-1.5";
const fourColGridClassName = "grid grid-cols-4 gap-1.5";

function renderOddsGrid(
  options: ComboOddsOption[],
  gridClassName: string,
  selectedOddsId: string | null | undefined,
  onSelectOdds: ExpandedBodyProps["onSelectOdds"],
  optionsConfig?: { mutedLabel?: boolean }
) {
  return (
    <div className={gridClassName}>
      {options.map((option) => (
        <ComboOddsButton
          key={option.id}
          option={option}
          selected={selectedOddsId === option.id}
          mobile
          compact
          mutedLabel={optionsConfig?.mutedLabel}
          onClick={() => onSelectOdds?.(option)}
        />
      ))}
    </div>
  );
}

export function MobileExpandedDrawer({
  kickoffLabel,
  isLive,
  homeTeam,
  awayTeam,
  moneylineOdds,
  halftimeOdds = [],
  bttsOdds = [],
  spreadOdds,
  topScoreOdds,
  totalOdds = [],
  selectedOddsId,
  onSelectOdds
}: MobileExpandedDrawerProps) {
  return (
    <div className="pb-[calc(16px+env(safe-area-inset-bottom,0px))]">
      <MobileDrawerHeader
        kickoffLabel={kickoffLabel}
        isLive={isLive}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
      />

      <MobileDrawerOddsSection title="Moneyline">
        {renderOddsGrid(
          moneylineOdds,
          moneylineGridClassName,
          selectedOddsId,
          onSelectOdds
        )}
      </MobileDrawerOddsSection>

      {spreadOdds.length ? (
        <MobileDrawerOddsSection title="Spreads">
          {renderOddsGrid(
            spreadOdds,
            threeColGridClassName,
            selectedOddsId,
            onSelectOdds,
            { mutedLabel: true }
          )}
        </MobileDrawerOddsSection>
      ) : null}

      {totalOdds.length ? (
        <MobileDrawerOddsSection title="Totals">
          {renderOddsGrid(
            totalOdds,
            fourColGridClassName,
            selectedOddsId,
            onSelectOdds,
            { mutedLabel: true }
          )}
        </MobileDrawerOddsSection>
      ) : null}

      {topScoreOdds.length ? (
        <MobileDrawerOddsSection title="Top Scores">
          {renderOddsGrid(
            topScoreOdds,
            fourColGridClassName,
            selectedOddsId,
            onSelectOdds
          )}
        </MobileDrawerOddsSection>
      ) : null}

      {halftimeOdds.length ? (
        <MobileDrawerOddsSection title="Halftime">
          {renderOddsGrid(
            halftimeOdds,
            moneylineGridClassName,
            selectedOddsId,
            onSelectOdds
          )}
        </MobileDrawerOddsSection>
      ) : null}

      {bttsOdds.length ? (
        <MobileDrawerOddsSection title="BTTS">
          {renderOddsGrid(
            bttsOdds,
            threeColGridClassName,
            selectedOddsId,
            onSelectOdds
          )}
        </MobileDrawerOddsSection>
      ) : null}
    </div>
  );
}
