import { ComboOddsButton } from "@/views/combo/combo-item/combo-odds-button";
import { MobileOddsExpandButton } from "@/views/combo/combo-item/mobile-odds-expand-button";
import type { CollapsedBodyProps } from "@/views/combo/combo-item/types";

export type MobileCollapsedBodyProps = CollapsedBodyProps & {
  totalOddsCount: number;
  onOpenAllOdds?: () => void;
};

export function MobileCollapsedBody({
  moneylineOdds,
  previewOdds,
  isOptionSelected,
  onSelectOdds,
  totalOddsCount,
  onOpenAllOdds
}: MobileCollapsedBodyProps) {
  const showPreviewRow =
    previewOdds.length > 0 || totalOddsCount > moneylineOdds.length;

  return (
    <div className="px-3 pb-3 md:hidden">
      <div className="grid grid-cols-3 gap-1.5">
        {moneylineOdds.map((option) => (
          <ComboOddsButton
            key={option.id}
            option={option}
            selected={isOptionSelected(option.id)}
            wide
            compact
            mobile
            onClick={() => onSelectOdds?.(option)}
          />
        ))}
      </div>

      {showPreviewRow ? (
        <div className="mt-1.5 flex gap-1.5">
          {previewOdds.slice(0, 4).map((option) => (
            <ComboOddsButton
              key={option.id}
              option={option}
              selected={isOptionSelected(option.id)}
              compact
              mobile
              className="min-w-0 flex-1"
              onClick={() => onSelectOdds?.(option)}
            />
          ))}
          {totalOddsCount > moneylineOdds.length ? (
            <MobileOddsExpandButton onClick={onOpenAllOdds} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
