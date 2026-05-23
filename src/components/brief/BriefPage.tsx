"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getMarketDataSourceLabel } from "../../data/providers/source";
import type { MarketDataMeta } from "../../data/providers/types";
import { generateMarketSignals, getBiggestLosers, getOddsMismatch, getTopMovers } from "../../lib/market/analyzer";
import { teamTradeHref } from "../../lib/routes/trade";
import { createDailyBriefMarkdown, createWatchlistAlerts } from "../../lib/market/brief";
import type { WatchlistAlert } from "../../lib/market/brief";
import type { MarketSignal, NewsEvent, TeamMarketSnapshot, UserFavourite } from "../../types/market";
import { DataStatusBanner, SourceDisclosure } from "../data/DataStatusBanner";
import { formatChange, formatProbability, formatVolume, getChangeTone } from "../home/market-formatters";
import { loadTradingSession } from "../trading/tradingWalletSession";

interface BriefPageProps {
  snapshots: TeamMarketSnapshot[];
  newsEvents: NewsEvent[];
  dataStatus: MarketDataMeta;
}

export function BriefPage({ snapshots, newsEvents, dataStatus }: BriefPageProps) {
  const [watchlistIds, setWatchlistIds] = useState<string[]>([]);
  const signals = useMemo(() => generateMarketSignals(snapshots, newsEvents), [snapshots, newsEvents]);
  const topMovers = useMemo(() => getTopMovers(snapshots, 5), [snapshots]);
  const biggestLosers = useMemo(() => getBiggestLosers(snapshots, 5), [snapshots]);
  const oddsMismatch = useMemo(() => getOddsMismatch(snapshots, 5), [snapshots]);
  const alerts = useMemo(
    () => createWatchlistAlerts({ snapshots, newsEvents, signals, watchlistIds }),
    [snapshots, newsEvents, signals, watchlistIds],
  );
  const markdown = useMemo(
    () =>
      createDailyBriefMarkdown({
        snapshots,
        signals,
        alerts,
        newsEvents,
        sourceLabel: getMarketDataSourceLabel(dataStatus.source),
        lastUpdated: dataStatus.lastUpdated,
      }),
    [snapshots, signals, alerts, newsEvents, dataStatus.source, dataStatus.lastUpdated],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadFavourites() {
      const session = await loadTradingSession();

      if (!session) {
        if (!cancelled) {
          setWatchlistIds([]);
        }
        return;
      }

      try {
        const payload = await fetchJson<{ favourites: UserFavourite[] }>("/api/favourites");

        if (!cancelled) {
          setWatchlistIds(payload.favourites.filter((item) => item.entityType === "team").map((item) => item.entityId));
        }
      } catch {
        if (!cancelled) {
          setWatchlistIds([]);
        }
      }
    }

    void loadFavourites();

    return () => {
      cancelled = true;
    };
  }, []);

  async function exportMarkdown() {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(markdown);
    }
  }

  return (
    <main className="terminal-grid min-h-screen px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 lg:gap-10">
        <section className="rounded-lg border border-terminal-line bg-terminal-panel/90 p-6 shadow-terminal sm:p-8 lg:p-10">
          <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.22em] text-terminal-muted">
            <Link href="/" className="hover:text-terminal-cyan">
              Market
            </Link>
            <Link href="/feed" className="hover:text-terminal-cyan">
              Feed
            </Link>
            <Link href="/watchlist" className="hover:text-terminal-cyan">
              Watchlist
            </Link>
          </div>
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-terminal-cyan">Daily market brief</p>
              <h1 className="mt-4 font-display text-5xl leading-none text-terminal-text sm:text-7xl">
                Daily Brief
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-terminal-muted">
                A compact readout of today&apos;s market movement, signal explanations, watchlist alerts,
                news context, and pricing divergence. It is informational only.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <HeaderMetric label="Signals" value={String(signals.length)} />
              <HeaderMetric label="Alerts" value={String(alerts.length)} />
              <HeaderMetric label="Source" value={dataStatus.source} />
            </div>
          </div>
        </section>

        <DataStatusBanner meta={dataStatus} />
        <SourceDisclosure compact />

        <div className="grid gap-8 xl:grid-cols-2">
          <SnapshotList title="Today's Biggest Movers" eyebrow="Upside repricing" snapshots={topMovers} />
          <SnapshotList title="Biggest Losers" eyebrow="Downside repricing" snapshots={biggestLosers} />
        </div>

        <section className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
          <SignalPanel signals={signals.slice(0, 8)} />
          <WatchlistAlertPanel alerts={alerts} />
        </section>

        <section className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <NewsPanel newsEvents={newsEvents} />
          <OddsMismatchPanel oddsMismatch={oddsMismatch} />
        </section>

        <section className="rounded-lg border border-terminal-line bg-terminal-panel/90 p-5 shadow-terminal sm:p-7 lg:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-terminal-cyan">Suggested content export</p>
              <h2 className="mt-3 font-display text-3xl text-terminal-text sm:text-4xl">Markdown Brief</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-terminal-muted">
                Copy a neutral market-context summary for notes, newsletters, or internal review.
              </p>
            </div>
            <button
              type="button"
              onClick={exportMarkdown}
              className="rounded border border-terminal-green/60 bg-terminal-green/10 px-4 py-3 text-sm font-semibold text-terminal-green transition hover:bg-terminal-green/20"
            >
              Copy Markdown
            </button>
          </div>
          <pre className="mt-6 max-h-[360px] overflow-auto rounded-lg border border-terminal-line bg-black/35 p-4 text-xs leading-5 text-terminal-muted">
            {markdown}
          </pre>
        </section>
      </div>
    </main>
  );
}

function SnapshotList({
  title,
  eyebrow,
  snapshots,
}: {
  title: string;
  eyebrow: string;
  snapshots: TeamMarketSnapshot[];
}) {
  return (
    <section className="rounded-lg border border-terminal-line bg-terminal-panel/90 p-5 shadow-terminal sm:p-7">
      <SectionHeader eyebrow={eyebrow} title={title} />
      <div className="mt-6 grid gap-4">
        {snapshots.length > 0 ? (
          snapshots.map((snapshot) => (
            <Link
              key={snapshot.team.id}
              href={teamTradeHref(snapshot.team.id)}
              className="rounded-lg border border-terminal-line bg-terminal-panel2/75 p-4 transition hover:border-terminal-cyan/50"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">{snapshot.team.code}</p>
                  <h3 className="mt-2 text-lg font-semibold text-terminal-text">{snapshot.team.name}</h3>
                </div>
                <p className={`text-sm font-semibold ${getChangeTone(snapshot.market.change24h)}`}>
                  {formatChange(snapshot.market.change24h)}
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <BriefMetric label="Probability" value={formatProbability(snapshot.market.probability)} />
                <BriefMetric label="Volume" value={formatVolume(snapshot.market.volume)} />
              </div>
            </Link>
          ))
        ) : (
          <EmptyPanel message="No teams cleared this movement filter." />
        )}
      </div>
    </section>
  );
}

function SignalPanel({ signals }: { signals: MarketSignal[] }) {
  return (
    <section className="rounded-lg border border-terminal-line bg-terminal-panel/90 p-5 shadow-terminal sm:p-7">
      <SectionHeader eyebrow="Top market signals" title="Signal Brief" />
      <div className="mt-6 grid gap-4">
        {signals.length > 0 ? (
          signals.map((signal) => (
            <Link key={signal.id} href={teamTradeHref(signal.teamId)} className="rounded-lg border border-terminal-line bg-terminal-panel2/75 p-4 transition hover:border-terminal-cyan/50">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-terminal-muted">{formatSignalType(signal.type)}</p>
                <p className="text-xs font-semibold text-terminal-cyan">{signal.confidence}% confidence</p>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-terminal-text">{signal.title}</h3>
              <p className="mt-2 text-sm leading-6 text-terminal-muted">{signal.shortDescription}</p>
            </Link>
          ))
        ) : (
          <EmptyPanel message="No market signals cleared the current thresholds." />
        )}
      </div>
    </section>
  );
}

function WatchlistAlertPanel({ alerts }: { alerts: WatchlistAlert[] }) {
  return (
    <section className="rounded-lg border border-terminal-line bg-terminal-panel/90 p-5 shadow-terminal sm:p-7">
      <SectionHeader eyebrow="Watchlist alerts" title="Local Watch Alerts" />
      <div className="mt-6 grid gap-4">
        {alerts.length > 0 ? (
          alerts.slice(0, 6).map((alert) => (
            <Link key={alert.id} href={teamTradeHref(alert.teamId)} className="rounded-lg border border-terminal-line bg-terminal-panel2/75 p-4 transition hover:border-terminal-cyan/50">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-terminal-muted">{alert.teamName}</p>
                <span className={getSeverityClassName(alert.severity)}>{alert.severity}</span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-terminal-text">{alert.title}</h3>
              <p className="mt-2 text-sm leading-6 text-terminal-muted">{alert.description}</p>
            </Link>
          ))
        ) : (
          <EmptyPanel message="No favourite alerts. Connect a wallet and save teams to personalize this section." />
        )}
      </div>
    </section>
  );
}

function NewsPanel({ newsEvents }: { newsEvents: NewsEvent[] }) {
  return (
    <section className="rounded-lg border border-terminal-line bg-terminal-panel/90 p-5 shadow-terminal sm:p-7">
      <SectionHeader eyebrow="News impact" title="News Context" />
      <div className="mt-6 grid gap-4">
        {newsEvents.length > 0 ? (
          newsEvents.slice(0, 6).map((event) => (
            <article key={event.id} className="rounded-lg border border-terminal-line bg-terminal-panel2/75 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-terminal-muted">{event.source}</p>
                <p className={event.impactScore >= 0 ? "text-xs text-terminal-green" : "text-xs text-terminal-red"}>
                  Impact {event.impactScore >= 0 ? "+" : ""}
                  {event.impactScore}
                </p>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-terminal-text">{event.headline}</h3>
              <p className="mt-2 text-sm leading-6 text-terminal-muted">{event.summary}</p>
            </article>
          ))
        ) : (
          <EmptyPanel message="No tagged news context is available for this source." />
        )}
      </div>
    </section>
  );
}

function OddsMismatchPanel({
  oddsMismatch,
}: {
  oddsMismatch: ReturnType<typeof getOddsMismatch>;
}) {
  return (
    <section className="rounded-lg border border-terminal-line bg-terminal-panel/90 p-5 shadow-terminal sm:p-7">
      <SectionHeader eyebrow="Odds mismatch" title="Pricing Divergence" />
      <div className="mt-6 grid gap-4">
        {oddsMismatch.length > 0 ? (
          oddsMismatch.map((result) => (
            <Link key={result.team.id} href={teamTradeHref(result.team.id)} className="rounded-lg border border-terminal-line bg-terminal-panel2/75 p-4 transition hover:border-terminal-cyan/50">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-terminal-muted">{result.team.code}</p>
                <p className={result.mismatch >= 0 ? "text-sm font-semibold text-terminal-green" : "text-sm font-semibold text-terminal-red"}>
                  {formatChange(result.mismatch)}
                </p>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-terminal-text">{result.team.name}</h3>
              <p className="mt-2 text-sm leading-6 text-terminal-muted">
                Market probability is {Math.abs(result.mismatch).toFixed(1)} pts {result.marketIsHigherThanBookmaker ? "above" : "below"} the comparison price.
              </p>
            </Link>
          ))
        ) : (
          <EmptyPanel message="No pricing divergence clears the current threshold." />
        )}
      </div>
    </section>
  );
}

function HeaderMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-terminal-line bg-terminal-panel2/80 p-5">
      <p className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">{label}</p>
      <p className="mt-3 text-2xl font-semibold capitalize text-terminal-text">{value}</p>
    </div>
  );
}

function BriefMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.18em] text-terminal-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-terminal-text">{value}</p>
    </div>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.28em] text-terminal-cyan">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl text-terminal-text sm:text-4xl">{title}</h2>
    </div>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-terminal-line bg-terminal-panel2/60 p-5 text-sm text-terminal-muted">
      {message}
    </div>
  );
}

function getSeverityClassName(severity: WatchlistAlert["severity"]): string {
  const base = "rounded border px-2.5 py-1 text-[10px] uppercase tracking-[0.2em]";

  if (severity === "high") {
    return `${base} border-terminal-red/60 text-terminal-red`;
  }

  if (severity === "medium") {
    return `${base} border-terminal-amber/60 text-terminal-amber`;
  }

  return `${base} border-terminal-line text-terminal-muted`;
}

function formatSignalType(type: MarketSignal["type"]): string {
  return type.replace(/_/g, " ");
}

async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}
