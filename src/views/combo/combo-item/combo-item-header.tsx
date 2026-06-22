import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { ExpandToggle } from "@/views/combo/combo-item/expand-toggle";
import { LiveIndicator } from "@/views/combo/combo-item/live-indicator";
import { MatchupTitle } from "@/views/combo/combo-item/matchup-title";
import { MobileOddsCountBadge } from "@/views/combo/combo-item/mobile-odds-count-badge";
import type { ComboItemTeam } from "@/views/combo/combo-item/types";

export function ComboItemHeader({
  kickoffLabel,
  isLive,
  expanded,
  totalCount,
  selectedLegsCount,
  onToggleExpanded,
  centerContent,
  homeTeam,
  awayTeam
}: {
  kickoffLabel: string;
  isLive?: boolean;
  expanded: boolean;
  totalCount: number;
  selectedLegsCount: number;
  onToggleExpanded: () => void;
  centerContent?: ReactNode;
  homeTeam?: ComboItemTeam;
  awayTeam?: ComboItemTeam;
}) {
  return (
    <>
      <div className="border-b border-[#EBEBEB] px-3 pb-3 pt-3 md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <span className="text-xs font-[400] leading-[15px] text-[#909090]">
              {kickoffLabel}
            </span>
            {isLive ? <LiveIndicator compact mobile /> : null}
          </div>
          {selectedLegsCount > 0 ? (
            <MobileOddsCountBadge count={selectedLegsCount} />
          ) : null}
        </div>

        {homeTeam && awayTeam ? (
          <div className="mt-3 flex justify-center">
            <MatchupTitle homeTeam={homeTeam} awayTeam={awayTeam} mobile />
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          "hidden flex-col gap-3 px-4 pt-4 pb-2 md:flex",
          expanded && "border-b border-[#EBEBEB] pb-4"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <span className="text-sm font-[400] leading-[18px] text-[#909090]">
              {kickoffLabel}
            </span>
            {isLive ? <LiveIndicator compact={expanded} /> : null}
          </div>
          <ExpandToggle
            expanded={expanded}
            totalCount={totalCount}
            onToggle={onToggleExpanded}
          />
        </div>

        {centerContent ? (
          <div className="flex justify-center">{centerContent}</div>
        ) : null}
      </div>
    </>
  );
}
