import Link from "next/link";

import { getMarketDataSourceLabel, VISIBLE_MARKET_DATA_SOURCES } from "@/data/providers/source";
import type { MarketDataSource } from "@/data/providers/types";

export function DataSourceSwitch({ selectedSource }: { selectedSource: MarketDataSource }) {
  if (VISIBLE_MARKET_DATA_SOURCES.length <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Market data source"
      className="flex flex-wrap gap-2 rounded-lg border border-terminal-line bg-black/30 p-1.5"
    >
      {VISIBLE_MARKET_DATA_SOURCES.map((source) => {
        const isSelected = selectedSource === source;

        return (
          <Link
            key={source}
            href="/fifa"
            aria-current={isSelected ? "page" : undefined}
            className={
              isSelected
                ? "rounded-md border border-terminal-orange/55 bg-terminal-orange/15 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-terminal-orange shadow-[0_0_18px_rgba(255,106,42,0.15)]"
                : "rounded-md border border-transparent px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-terminal-muted transition hover:border-terminal-line hover:text-terminal-text"
            }
          >
            {getMarketDataSourceLabel(source)}
          </Link>
        );
      })}
    </nav>
  );
}
