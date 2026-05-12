import type { MarketDataMeta } from "../../data/providers/types";
import { getMarketDataSourceLabel } from "../../data/providers/source";

export function DataStatusBanner({ meta }: { meta: MarketDataMeta }) {
  const isLive = meta.status === "live";
  const sourceLabel = getMarketDataSourceLabel(meta.source);
  const newsStatus = getNewsStatusLabel(meta.news);
  const footballStatus = getFootballStatusLabel(meta.football);

  return (
    <div
      className={
        isLive
          ? "rounded-lg border border-terminal-green/35 bg-terminal-green/10 px-4 py-3 text-sm text-terminal-green"
          : "rounded-lg border border-terminal-amber/45 bg-terminal-amber/10 px-4 py-3 text-sm text-terminal-amber"
      }
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className={isLive ? "h-2 w-2 rounded-full bg-terminal-green" : "h-2 w-2 rounded-full bg-terminal-amber"} />
          <span className="font-semibold">
            {isLive ? `Live ${sourceLabel} data` : "Fallback mock data"}
          </span>
          {meta.stale ? <span>/ stale</span> : null}
          {newsStatus ? <span className="text-terminal-muted">/ {newsStatus}</span> : null}
          {footballStatus ? <span className="text-terminal-muted">/ {footballStatus}</span> : null}
          {meta.error ? <span className="text-terminal-muted">/ {meta.error}</span> : null}
        </div>
        <span className="terminal-label text-[10px] uppercase tracking-[0.18em]">
          Last updated {formatUpdatedAt(meta.lastUpdated)}
        </span>
      </div>
    </div>
  );
}

function getFootballStatusLabel(football: MarketDataMeta["football"]): string | undefined {
  if (!football) {
    return undefined;
  }

  if (football.status === "missing_api_key") {
    return "API-Football key missing";
  }

  if (football.status === "unavailable") {
    return "API-Football unavailable";
  }

  return `${football.teamCount} API-Football team profiles`;
}

function getNewsStatusLabel(news: MarketDataMeta["news"]): string | undefined {
  if (!news) {
    return undefined;
  }

  if (news.status === "mock") {
    return `${news.articleCount} mock news items`;
  }

  if (news.status === "unavailable") {
    return "GDELT news unavailable";
  }

  return `${news.articleCount} GDELT related news items`;
}

function formatUpdatedAt(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
