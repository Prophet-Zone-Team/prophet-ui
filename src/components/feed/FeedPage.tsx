"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { MarketDataMeta } from "../../data/providers/types";
import { generateMarketSignals } from "../../lib/market/analyzer";
import { readStoredWatchlist, writeStoredWatchlist } from "../../lib/storage/local-terminal";
import type { MarketSignal, NewsEvent, TeamMarketSnapshot } from "../../types/market";
import { DataStatusBanner, SourceDisclosure } from "../data/DataStatusBanner";
import { formatChange, formatProbability, formatVolume, getChangeTone } from "../home/market-formatters";

interface FeedPageProps {
  snapshots: TeamMarketSnapshot[];
  newsEvents: NewsEvent[];
  dataStatus: MarketDataMeta;
}

export function FeedPage({ snapshots, newsEvents, dataStatus }: FeedPageProps) {
  const [watchlistIds, setWatchlistIds] = useState<string[]>([]);
  const signals = useMemo(() => generateMarketSignals(snapshots, newsEvents).slice(0, 24), [snapshots, newsEvents]);
  const topConfidence = signals.reduce((max, signal) => Math.max(max, signal.confidence), 0);

  useEffect(() => {
    setWatchlistIds(readStoredWatchlist());
  }, []);

  function addToWatchlist(teamId: string) {
    const currentIds = readStoredWatchlist();

    if (currentIds.includes(teamId)) {
      setWatchlistIds(currentIds);
      return;
    }

    const nextIds = [teamId, ...currentIds];
    writeStoredWatchlist(nextIds);
    setWatchlistIds(nextIds);
  }

  return (
    <main className="terminal-grid min-h-screen px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:gap-10">
        <aside className="lg:sticky lg:top-8 lg:h-fit">
          <section className="rounded-lg border border-terminal-line bg-terminal-panel/90 p-6 shadow-terminal sm:p-8">
            <TopLinks source={dataStatus.source} />
            <p className="mt-8 text-[10px] uppercase tracking-[0.28em] text-terminal-cyan">Signal feed</p>
            <h1 className="mt-4 font-display text-5xl leading-none text-terminal-text sm:text-7xl lg:text-6xl">
              Market Signal Feed
            </h1>
            <p className="mt-5 text-sm leading-7 text-terminal-muted">
              A consumer-readable tape of probability movement, volume pressure, pricing divergence,
              sentiment, and possible related news coverage. Each card explains the data behind the signal.
            </p>
            <div className="mt-7 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <FeedMetric label="Signals" value={String(signals.length)} />
              <FeedMetric label="Top confidence" value={topConfidence ? `${topConfidence}%` : "Pending"} />
              <FeedMetric label="News" value={dataStatus.news?.source === "gdelt" ? "GDELT" : "Local"} />
            </div>
          </section>
        </aside>

        <section className="grid gap-5">
          <DataStatusBanner meta={dataStatus} />
          <SourceDisclosure compact />
          {signals.length > 0 ? (
            signals.map((signal) => {
              const snapshot = snapshots.find((item) => item.team.id === signal.teamId);

              return (
                <FeedCard
                  key={signal.id}
                  signal={signal}
                  snapshot={snapshot}
                  source={dataStatus.source}
                  isWatching={watchlistIds.includes(signal.teamId)}
                  onAddToWatchlist={() => addToWatchlist(signal.teamId)}
                />
              );
            })
          ) : (
            <section className="rounded-lg border border-terminal-line bg-terminal-panel/90 p-6 shadow-terminal">
              <h2 className="font-display text-3xl text-terminal-text">No signal threshold cleared</h2>
              <p className="mt-3 text-sm leading-6 text-terminal-muted">
                The feed will populate when movement, volume, news impact, sentiment, or pricing divergence becomes meaningful.
              </p>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}

function FeedCard({
  signal,
  snapshot,
  source,
  isWatching,
  onAddToWatchlist,
}: {
  signal: MarketSignal;
  snapshot: TeamMarketSnapshot | undefined;
  source: MarketDataMeta["source"];
  isWatching: boolean;
  onAddToWatchlist: () => void;
}) {
  return (
    <article className="rounded-lg border border-terminal-line bg-terminal-panel/92 p-5 shadow-terminal transition duration-200 hover:border-terminal-cyan/55 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className={getTypeClassName(signal.type)}>{formatSignalType(signal.type)}</span>
            {snapshot ? (
              <span className="text-[10px] uppercase tracking-[0.2em] text-terminal-muted">{snapshot.team.code}</span>
            ) : null}
          </div>
          <h2 className="mt-4 text-2xl font-semibold leading-tight text-terminal-text">{signal.title}</h2>
          <p className="mt-2 text-sm leading-6 text-terminal-muted">{signal.shortDescription}</p>
        </div>
        <div className="rounded-lg border border-terminal-line bg-terminal-panel2/80 px-4 py-3 text-right">
          <p className="text-[10px] uppercase tracking-[0.18em] text-terminal-muted">Confidence</p>
          <p className="mt-1 text-lg font-semibold text-terminal-text">{signal.confidence}%</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg border border-terminal-line bg-terminal-panel2/75 p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-terminal-muted">Related team</p>
          <p className="mt-2 text-lg font-semibold text-terminal-text">{snapshot?.team.name ?? signal.teamId}</p>
          {snapshot ? (
            <>
              <p className={`mt-3 text-sm font-semibold ${getChangeTone(snapshot.market.change24h)}`}>
                {formatChange(snapshot.market.change24h)} 24h probability change
              </p>
              <p className="mt-2 text-xs text-terminal-muted">
                {formatProbability(snapshot.market.probability)} current probability / {formatVolume(snapshot.market.volume)} volume
              </p>
            </>
          ) : null}
        </div>
        <div className="rounded-lg border border-terminal-line bg-terminal-panel2/75 p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-terminal-muted">Signal read</p>
          <p className="mt-2 text-sm leading-6 text-terminal-muted">{signal.explanation}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {signal.dataPoints.map((point) => (
          <SignalDataPoint key={`${signal.id}-${point.label}`} point={point} />
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-3 border-t border-terminal-line/70 pt-5">
        <Link
          href={`/team/${signal.teamId}?source=${source}`}
          className="rounded border border-terminal-cyan/60 bg-terminal-cyan/10 px-3 py-2 text-xs font-semibold text-terminal-cyan transition hover:bg-terminal-cyan/20"
        >
          View Team
        </Link>
        <button
          type="button"
          onClick={onAddToWatchlist}
          className="rounded border border-terminal-green/60 bg-terminal-green/10 px-3 py-2 text-xs font-semibold text-terminal-green transition hover:bg-terminal-green/20"
        >
          {isWatching ? "Watching" : "Add to Watchlist"}
        </button>
        <Link
          href={`/?source=${source}`}
          className="rounded border border-terminal-line bg-terminal-panel2 px-3 py-2 text-xs font-semibold text-terminal-muted transition hover:border-terminal-cyan/60 hover:text-terminal-cyan"
        >
          Explore Market
        </Link>
      </div>
    </article>
  );
}

function TopLinks({ source }: { source: MarketDataMeta["source"] }) {
  return (
    <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.22em] text-terminal-muted">
      <Link href={`/?source=${source}`} className="hover:text-terminal-cyan">
        Market
      </Link>
      <Link href={`/watchlist?source=${source}`} className="hover:text-terminal-cyan">
        Watchlist
      </Link>
      <Link href={`/brief?source=${source}`} className="hover:text-terminal-cyan">
        Brief
      </Link>
    </div>
  );
}

function FeedMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-terminal-line bg-terminal-panel2/80 p-5">
      <p className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">{label}</p>
      <p className="mt-3 text-2xl font-semibold capitalize text-terminal-text">{value}</p>
    </div>
  );
}

function SignalDataPoint({ point }: { point: MarketSignal["dataPoints"][number] }) {
  return (
    <div className="rounded-lg border border-terminal-line bg-terminal-panel2/75 p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-terminal-muted">{point.label}</p>
      <p className={`mt-2 text-sm font-semibold ${getDataPointTone(point.tone)}`}>{point.value}</p>
    </div>
  );
}

function getDataPointTone(tone: MarketSignal["dataPoints"][number]["tone"]): string {
  if (tone === "positive") {
    return "text-terminal-green";
  }

  if (tone === "negative") {
    return "text-terminal-red";
  }

  return "text-terminal-text";
}

function getTypeClassName(type: MarketSignal["type"]): string {
  const base = "rounded border px-2.5 py-1 text-[10px] uppercase tracking-[0.2em]";

  switch (type) {
    case "heating_up":
    case "quiet_accumulation":
      return `${base} border-terminal-green/60 text-terminal-green`;
    case "news_impact":
    case "sentiment_driven":
      return `${base} border-terminal-cyan/60 text-terminal-cyan`;
    case "volume_spike":
    case "overheated":
      return `${base} border-terminal-amber/60 text-terminal-amber`;
    case "cooling_down":
    case "odds_mismatch":
      return `${base} border-terminal-red/60 text-terminal-red`;
  }
}

function formatSignalType(type: MarketSignal["type"]): string {
  return type.replace(/_/g, " ");
}
