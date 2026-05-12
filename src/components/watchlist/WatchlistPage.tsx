"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { MarketDataMeta } from "../../data/providers/types";
import { readStoredWatchlist, writeStoredWatchlist } from "../../lib/storage/local-terminal";
import type { NewsEvent, TeamMarketSnapshot } from "../../types/market";
import { DataStatusBanner } from "../data/DataStatusBanner";
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
            <Link href="/" className="hover:text-terminal-cyan">
              Market
            </Link>
            <Link href="/feed" className="hover:text-terminal-cyan">
              Feed
            </Link>
            <Link href="/bid" className="hover:text-terminal-cyan">
              Mock bid
            </Link>
          </div>
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-terminal-cyan">Local watch desk</p>
              <h1 className="mt-4 font-display text-5xl leading-none text-terminal-text sm:text-7xl">
                Watchlist Page
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-terminal-muted">
                Track locally saved teams, probability changes, volume context, and possible related news alerts.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <HeaderMetric label="Watched teams" value={String(watchedSnapshots.length)} />
              <HeaderMetric label="News alerts" value={String(countNewsAlerts(watchedSnapshots, newsEvents))} />
              <HeaderMetric label="Storage" value="Local only" />
            </div>
          </div>
        </section>
        <DataStatusBanner meta={dataStatus} />

        {watchedSnapshots.length > 0 ? (
          <section className="grid gap-5">
            {watchedSnapshots.map((snapshot) => (
              <WatchlistTeamCard
                key={snapshot.team.id}
                snapshot={snapshot}
                news={newsEvents.filter((event) => event.teamId === snapshot.team.id)}
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
              href="/"
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
  onRemove,
}: {
  snapshot: TeamMarketSnapshot;
  news: NewsEvent[];
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
            Group {team.group} / {team.region}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={`/team/${team.id}`} className="rounded border border-terminal-cyan/50 px-3 py-2 text-xs text-terminal-cyan">
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

function countNewsAlerts(snapshots: TeamMarketSnapshot[], newsEvents: NewsEvent[]): number {
  const teamIds = new Set(snapshots.map((snapshot) => snapshot.team.id));
  return newsEvents.filter((event) => teamIds.has(event.teamId)).length;
}

function isSnapshot(snapshot: TeamMarketSnapshot | undefined): snapshot is TeamMarketSnapshot {
  return Boolean(snapshot);
}
