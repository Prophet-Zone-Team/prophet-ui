import { getMarketDataSourceLabel } from "@/data/providers/source";
import type { MarketDataMeta } from "@/data/providers/types";

export interface TeamDetailFootnoteProps {
  dataStatus: MarketDataMeta;
}

export function TeamDetailFootnote({ dataStatus }: TeamDetailFootnoteProps) {
  return (
    <footer className="mt-6 flex flex-col gap-1 border-t border-prophet-line pt-4 text-[11px] leading-relaxed text-prophet-muted">
      <span>
        Source: curated football metadata, API-Football team context, GDELT news,
        The Odds API, and {getMarketDataSourceLabel(dataStatus.source)} market
        data.
      </span>
      <span>
        All probability, payout, and signal views are analytical context only.
      </span>
    </footer>
  );
}
