import { formatSharePrice } from "@/lib/portfolio/portfolio-format";
import type { PortfolioComboPositionPick } from "@/lib/portfolio/combo-positions/types";
import { PositionPickTeamFlag } from "@/views/combo/position-card/position-pick-team-flag";
import { resolvePickTeamFromMarketTitle } from "@/views/combo/position-card/resolve-pick-team";

export type PositionCardModalPickItemProps = {
  pick: PortfolioComboPositionPick;
};

export function PositionCardModalPickItem({
  pick
}: PositionCardModalPickItemProps) {
  const team = resolvePickTeamFromMarketTitle(pick.marketTitle);
  const priceLabel =
    pick.legPrice != null && pick.legPrice > 0
      ? formatSharePrice(pick.legPrice)
      : null;

  return (
    <div className="flex items-center gap-2">
      <PositionPickTeamFlag
        logoUrl={team?.logo ?? pick.team.logoUrl}
        code={pick.team.code}
        name={pick.marketTitle}
        legStatus={pick.legStatus}
      />

      <div className="min-w-0 flex-1">
        <p className="m-0 truncate text-xs font-[400] leading-[15px] text-black">
          {pick.matchupLabel}
        </p>
        <p className="m-0 truncate text-sm font-[500] leading-[18px] text-black">
          {pick.selectionLabel}
        </p>
      </div>

      {priceLabel ? (
        <span className="shrink-0 text-sm font-[500] leading-[18px] text-black">
          {priceLabel}
        </span>
      ) : null}
    </div>
  );
}
