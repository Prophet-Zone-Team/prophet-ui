import type { ReactNode } from "react";

import type { MarketDataMeta } from "@/data/providers/types";
import type { TeamMarketSnapshot } from "@/types/market";
import { MarketListItem } from "@/views/markets/market-list-item";

export interface MarketListPanelProps {
  teams: TeamMarketSnapshot[];
  dataStatus: MarketDataMeta;
  ariaLabel: string;
  hasLiveValues?: boolean;
  isLoading?: boolean;
  emptyState?: ReactNode;
  getNavigationDisabled?: (snapshot: TeamMarketSnapshot) => boolean;
}

export function MarketListPanel({
  teams,
  dataStatus,
  ariaLabel,
  hasLiveValues = true,
  isLoading = false,
  emptyState,
  getNavigationDisabled
}: MarketListPanelProps) {
  return (
    <section className="min-w-0" aria-label={ariaLabel}>
      {teams.length === 0 && emptyState ? (
        emptyState
      ) : (
        <div className="grid gap-2 overflow-visible pb-10">
          {teams.map((snapshot, index) => (
            <MarketListItem
              key={snapshot.team.id}
              snapshot={snapshot}
              rank={index + 1}
              hasLiveValues={hasLiveValues}
              isLoading={isLoading}
              navigationDisabled={getNavigationDisabled?.(snapshot)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

