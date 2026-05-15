"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { MarketDataMeta } from "../../data/providers/types";
import { generateMarketSignals } from "../../lib/market/analyzer";
import { createWatchlistAlerts } from "../../lib/market/brief";
import type { WatchlistAlert } from "../../lib/market/brief";
import { readStoredWatchlist, writeStoredWatchlist } from "../../lib/storage/local-terminal";
import type { NewsEvent, TeamMarketSnapshot } from "../../types/market";
import { DataStatusBanner, SourceDisclosure } from "../data/DataStatusBanner";
import { formatChange, formatProbability, formatVolume, getChangeTone } from "../home/market-formatters";

interface WatchlistPageProps {
  snapshots: TeamMarketSnapshot[];
  newsEvents: NewsEvent[];
  dataStatus: MarketDataMeta;
}

export function WatchlistPage({ snapshots, newsEvents, dataStatus }: WatchlistPageProps) {
  const [watchlistIds, setWatchlistIds] = useState<string[]>([]);

  useEffect(() => {
    setWatchlistIds(readStoredWatchlist());
  }, []);

  const watchedSnapshots = useMemo(
    () => watchlistIds.map((id) => snapshots.find((snapshot) => snapshot.team.id === id)).filter(isSnapshot),
    [snapshots, watchlistIds],
  );
  const signals = useMemo(() => generateMarketSignals(snapshots, newsEvents), [snapshots, newsEvents]);
  const alerts = useMemo(
    () => createWatchlistAlerts({ snapshots, newsEvents, signals, watchlistIds }),
    [snapshots, newsEvents, signals, watchlistIds],
  );

  function removeTeam(teamId: string) {
    const nextIds = watchlistIds.filter((id) => id !== teamId);
    writeStoredWatchlist(nextIds);
    setWatchlistIds(nextIds);
  }

  return (
    <main className="terminal-grid min-h-screen px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 lg:gap-10">
        <section className="rounded-lg border border-terminal-line bg-terminal-panel/90 p-6 shadow-terminal sm:p-8 lg:p-10">
          <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.22em] text-terminal-muted">
            <Link href={`/?source=${dataStatus.source}`} className="hover:text-terminal-cyan">
              Market
            </Link>
            <Link href={`/feed?source=${dataStatus.source}`} className="hover:text-terminal-cyan">
              Feed
            </Link>
            <Link href={`/brief?source=${dataStatus.source}`} className="hover:text-terminal-cyan">
              Brief
            </Link>
          </div>
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-terminal-cyan">Local watch desk</p>
              <h1 className="mt-4 font-display text-5xl leading-none text-terminal-text sm:text-7xl">
                Watchlist
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-terminal-muted">
                Track locally saved teams, probability changes, volume context, signal alerts, and possible related news coverage.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <HeaderMetric label="Watched teams" value={String(watchedSnapshots.length)} />
              <HeaderMetric label="Local alerts" value={String(alerts.length)} />
              <HeaderMetric label="Storage" value="Local only" />
            </div>
          </div>
        </section>
        <DataStatusBanner meta={dataStatus} />
        <SourceDisclosure compact />

        <WatchlistAlerts alerts={alerts} source={dataStatus.source} />

        {watchedSnapshots.length > 0 ? (
          <section className="grid gap-5">
            {watchedSnapshots.map((snapshot) => (
              <WatchlistTeamCard
                key={snapshot.team.id}
                snapshot={snapshot}
                news={newsEvents.filter((event) => event.teamId === snapshot.team.id)}
                source={dataStatus.source}
                onRemove={() => removeTeam(snapshot.team.id)}
              />
            ))}
          </section>
        ) : (
          <section className="rounded-lg border border-terminal-line bg-terminal-panel/90 p-6 shadow-terminal sm:p-8">
            <h2 className="font-display text-3xl text-terminal-text sm:text-4xl">No teams on watchlist</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-terminal-muted">
              Add teams from a team detail page. The list is stored in this browser only and does not use a backend.
            </p>
            <Link
              href={`/?source=${dataStatus.source}`}
              className="mt-6 inline-flex rounded border border-terminal-cyan/60 bg-terminal-cyan/10 px-4 py-3 text-sm font-semibold text-terminal-cyan"
            >
              Browse market heatmap
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}

function WatchlistTeamCard({
  snapshot,
  news,
  source,
  onRemove,
}: {
  snapshot: TeamMarketSnapshot;
  news: NewsEvent[];
  source: MarketDataMeta["source"];
  onRemove: () => void;
}) {
  const { team, market } = snapshot;

  return (
    <article className="rounded-lg border border-terminal-line bg-terminal-panel/90 p-5 shadow-terminal sm:p-7">
      <div className="grid gap-7 lg:grid-cols-[0.9fr_1.1fr_0.7fr]">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">{team.code} / Watchlist</p>
          <h2 className="mt-3 text-3xl font-semibold text-terminal-text">{team.name}</h2>
          <p className="mt-2 text-xs text-terminal-muted">
            {team.code} / {team.region}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={`/team/${team.id}?source=${source}`} className="rounded border border-terminal-cyan/50 px-3 py-2 text-xs text-terminal-cyan">
              Team detail
            </Link>
            <button
              type="button"
              onClick={onRemove}
              className="rounded border border-terminal-red/50 px-3 py-2 text-xs text-terminal-red"
            >
              Remove
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Metric label="Probability" value={formatProbability(market.probability)} />
          <Metric label="24h change" value={formatChange(market.change24h)} tone={getChangeTone(market.change24h)} />
          <Metric label="7d change" value={formatChange(market.change7d)} tone={getChangeTone(market.change7d)} />
          <Metric label="Volume" value={formatVolume(market.volume)} />
        </div>

        <div className="rounded-lg border border-terminal-line bg-terminal-panel2/75 p-4">
          <p className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">News alerts</p>
          <div className="mt-4 grid gap-3">
            {news.length > 0 ? (
              news.slice(0, 2).map((event) => (
                <div key={event.id} className="border-b border-terminal-line/70 pb-3 last:border-b-0 last:pb-0">
                  <p className="text-sm font-semibold leading-5 text-terminal-text">{event.headline}</p>
                  <p className={event.impactScore >= 0 ? "mt-2 text-xs text-terminal-green" : "mt-2 text-xs text-terminal-red"}>
                    Impact {event.impactScore >= 0 ? "+" : ""}
                    {event.impactScore}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm leading-6 text-terminal-muted">No tagged related news alerts.</p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function WatchlistAlerts({ alerts, source }: { alerts: WatchlistAlert[]; source: MarketDataMeta["source"] }) {
  return (
    <section className="rounded-lg border border-terminal-line bg-terminal-panel/90 p-5 shadow-terminal sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-terminal-cyan">Watchlist alerts</p>
          <h2 className="mt-3 font-display text-3xl text-terminal-text sm:text-4xl">Local Alert Tape</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-terminal-muted">
            Alerts are generated in this browser from watched teams, movement thresholds, signal matches, and tagged news context.
          </p>
        </div>
        <Link
          href={`/brief?source=${source}`}
          className="inline-flex rounded border border-terminal-cyan/60 bg-terminal-cyan/10 px-4 py-3 text-sm font-semibold text-terminal-cyan"
        >
          Open brief
        </Link>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {alerts.length > 0 ? (
          alerts.slice(0, 6).map((alert) => (
            <article key={alert.id} className="rounded-lg border border-terminal-line bg-terminal-panel2/75 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-terminal-muted">{alert.teamName}</p>
                <span className={getSeverityClassName(alert.severity)}>{alert.severity}</span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-terminal-text">{alert.title}</h3>
              <p className="mt-2 text-sm leading-6 text-terminal-muted">{alert.description}</p>
            </article>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-terminal-line bg-terminal-panel2/60 p-5 text-sm text-terminal-muted lg:col-span-2">
            No local watchlist alerts are active. Add teams or wait for meaningful movement, news context, or signal changes.
          </div>
        )}
      </div>
    </section>
  );
}

function HeaderMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-terminal-line bg-terminal-panel2/80 p-5">
      <p className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-terminal-text">{value}</p>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "text-terminal-text",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-lg border border-terminal-line bg-terminal-panel2/75 p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-terminal-muted">{label}</p>
      <p className={`mt-2 text-lg font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function isSnapshot(snapshot: TeamMarketSnapshot | undefined): snapshot is TeamMarketSnapshot {
  return Boolean(snapshot);
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
