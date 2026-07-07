import { cn } from "@/lib/cn";
import { formatSharePrice } from "@/lib/portfolio/portfolio-format";
import type { PortfolioComboPositionPick } from "@/lib/portfolio/combo-positions/types";
import {
  comboMutedTextClass,
  comboTitleTextClass
} from "@/views/combo/combo-ui";
import { PositionPickTeamFlag } from "@/views/combo/position-card/position-pick-team-flag";
import { resolvePickTeamFromMarketTitle } from "@/views/combo/position-card/resolve-pick-team";

export type PositionCardModalPickTone = "app" | "export";

export type PositionCardModalPickItemProps = {
  pick: PortfolioComboPositionPick;
  tone?: PositionCardModalPickTone;
};

export function PositionCardModalPickItem({
  pick,
  tone = "app"
}: PositionCardModalPickItemProps) {
  const team = resolvePickTeamFromMarketTitle(pick.marketTitle);
  const priceLabel =
    pick.legPrice != null && pick.legPrice > 0
      ? formatSharePrice(pick.legPrice)
      : null;
  const mutedTextClass =
    tone === "export" ? "text-black" : comboMutedTextClass;
  const titleTextClass =
    tone === "export" ? "text-black" : comboTitleTextClass;

  return (
    <div className="flex items-center gap-2">
      <PositionPickTeamFlag
        logoUrl={team?.logo ?? pick.team.logoUrl}
        code={pick.team.code}
        name={pick.marketTitle}
        legStatus={pick.legStatus}
      />

      <div className="min-w-0 flex-1">
        <p className={cn("m-0 truncate text-xs font-[400] leading-[15px]", mutedTextClass)}>
          {pick.matchupLabel}
        </p>
        <p className={cn("m-0 truncate text-sm font-[500] leading-[18px]", titleTextClass)}>
          {pick.selectionLabel}
        </p>
      </div>

      {priceLabel ? (
        <span className={cn("shrink-0 text-sm font-[500] leading-[18px]", titleTextClass)}>
          {priceLabel}
        </span>
      ) : null}
    </div>
  );
}
