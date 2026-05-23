"use client";

import { TeamFlag } from "../../components/teams/TeamFlag";
import { cn } from "../../lib/cn";
import type { OrderOutcomeSide, TeamMarketSnapshot } from "../../types/market";

export interface TradeWidgetHeaderProps {
  snapshot: TeamMarketSnapshot;
  outcomeSide?: OrderOutcomeSide;
  showOutcomeLabel?: boolean;
}

export function TradeWidgetHeader({
  snapshot,
  outcomeSide = "yes",
  showOutcomeLabel = true
}: TradeWidgetHeaderProps) {
  const question =
    snapshot.market.polymarket?.question ??
    `Will ${snapshot.team.name} win the World Cup?`;

  return (
    <div className="flex items-start gap-2.5 px-4 pt-4">
      <TeamFlag
        code={snapshot.team.code}
        name={snapshot.team.name}
        className="!h-9 !w-9 shrink-0 rounded-md shadow-[0_0_2px_rgba(0,0,0,0.2)]"
      />
      <div className="min-w-0 flex-1">
        <p className="m-0 line-clamp-2 text-sm font-[556] leading-[17px] text-black">
          {question}
        </p>
        {showOutcomeLabel ? (
          <p
            className={cn(
              "m-0 mt-0.5 text-base font-[556] leading-[19px]",
              outcomeSide === "yes" ? "text-[#65AF14]" : "text-[#FF674B]"
            )}
          >
            {outcomeSide === "yes" ? "Yes" : "No"}
          </p>
        ) : null}
      </div>
    </div>
  );
}
