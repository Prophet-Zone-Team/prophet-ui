import type { ReactNode } from "react";

import type { MarketDataMeta } from "@/data/providers/types";
import type { TeamMarketSnapshot } from "@/types/market";
import { MarketListItem } from "@/views/markets/market-list-item";

export interface MarketListPanelProps {
  teams: TeamMarketSnapshot[];
  dataStatus: MarketDataMeta;
  ariaLabel: string;
  emptyState?: ReactNode;
  getNavigationDisabled?: (snapshot: TeamMarketSnapshot) => boolean;
}

export function MarketListPanel({
  teams,
  dataStatus,
  ariaLabel,
  emptyState,
  getNavigationDisabled
}: MarketListPanelProps) {
  return (
    <section className="min-w-0" aria-label={ariaLabel}>
      {teams.length === 0 && emptyState ? (
        emptyState
      ) : (
        <div className="grid gap-2 overflow-visible">
          {teams.map((snapshot, index) => (
            <MarketListItem
              key={snapshot.team.id}
              snapshot={snapshot}
              rank={index + 1}
              navigationDisabled={getNavigationDisabled?.(snapshot)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function formatUpdatedAt(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "pending";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
