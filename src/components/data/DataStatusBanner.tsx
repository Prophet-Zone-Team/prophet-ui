import type { MarketDataMeta } from "../../data/providers/types";
import { getMarketDataSourceLabel } from "../../data/providers/source";

export function DataStatusBanner({ meta }: { meta: MarketDataMeta }) {
  const tone = getStatusTone(meta);
  const sourceLabel = getMarketDataSourceLabel(meta.source);
  const oddsStatus = getOddsStatusLabel(meta.odds);
  const newsStatus = getNewsStatusLabel(meta.news);
  const footballStatus = getFootballStatusLabel(meta.football);

  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${tone.container}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
          <span className="font-semibold">{getStatusLabel(meta.status, sourceLabel)}</span>
          {meta.stale ? <span>/ stale snapshot</span> : null}
          {oddsStatus ? <span className="text-terminal-muted">/ {oddsStatus}</span> : null}
          {newsStatus ? <span className="text-terminal-muted">/ {newsStatus}</span> : null}
          {footballStatus ? <span className="text-terminal-muted">/ {footballStatus}</span> : null}
          {meta.error ? <span className="text-terminal-muted">/ {meta.error}</span> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.18em]">
          <span>Updated {formatUpdatedAt(meta.lastUpdated)}</span>
          <span>/</span>
          <span>{meta.source === "mock" ? "local sample data" : "read-only provider data"}</span>
        </div>
      </div>
    </div>
  );
}

export function SourceDisclosure({ compact = false }: { compact?: boolean }) {
  const items = [
    {
      label: "Probability",
      body: "Converted from the current prediction market price when live data is available; sample data uses the same percent format.",
    },
    {
      label: "24h change",
      body: "Calculated from stored snapshots when available, otherwise from the provider's reported short-window movement.",
    },
    {
      label: "Volume",
      body: "Provider-reported market activity. Availability and window can differ by source, so treat it as attention context.",
    },
    {
      label: "Odds mismatch",
      body: "Compares market probability with median bookmaker implied probability when The Odds API has an outright market. If that feed is missing or empty, the terminal labels the comparison as unavailable instead of inventing prices.",
    },
  ];

  return (
    <section className="rounded-lg border border-terminal-line bg-terminal-panel/88 p-4 shadow-terminal sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="terminal-label text-[10px] uppercase tracking-[0.24em] text-terminal-cyan">Data disclosure</p>
          {!compact ? (
            <p className="mt-2 text-sm leading-6 text-terminal-muted">
              These labels explain how the terminal reads market data. They are context, not predictions or advice.
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <details
            key={item.label}
            className="group rounded border border-terminal-line bg-terminal-panel2/65 p-3 text-sm"
          >
            <summary className="cursor-pointer list-none font-semibold text-terminal-text outline-none">
              <span>{item.label}</span>
              <span className="float-right text-terminal-muted transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-xs leading-5 text-terminal-muted">{item.body}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function getStatusTone(meta: MarketDataMeta): { container: string; dot: string } {
  switch (meta.status) {
    case "live":
      return {
        container: "border-terminal-green/35 bg-terminal-green/10 text-terminal-green",
        dot: "bg-terminal-green",
      };
    case "partial":
    case "cached":
      return {
        container: "border-terminal-cyan/35 bg-terminal-cyan/10 text-terminal-cyan",
        dot: "bg-terminal-cyan",
      };
    case "error":
    case "fallback":
      return {
        container: "border-terminal-amber/45 bg-terminal-amber/10 text-terminal-amber",
        dot: "bg-terminal-amber",
      };
  }
}

function getStatusLabel(status: MarketDataMeta["status"], sourceLabel: string): string {
  switch (status) {
    case "live":
      return `Live ${sourceLabel} data`;
    case "partial":
      return `Partial ${sourceLabel} data`;
    case "cached":
      return `Cached ${sourceLabel} data`;
    case "error":
      return `${sourceLabel} data error`;
    case "fallback":
      return "Fallback sample data";
  }
}

function getOddsStatusLabel(odds: MarketDataMeta["odds"]): string | undefined {
  if (!odds) {
    return undefined;
  }

  if (odds.status === "missing_api_key") {
    return "bookmaker odds key missing";
  }

  if (odds.status === "unavailable") {
    return "bookmaker odds unavailable";
  }

  if (odds.status === "empty") {
    return "no outright bookmaker odds";
  }

  return `${odds.bookmakerCount} bookmaker prices`;
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
    return `${news.articleCount} sample news items`;
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
