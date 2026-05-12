"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { MarketDataMeta } from "../../data/providers/types";
import { getOddsMismatch, getTopMovers } from "../../lib/market/analyzer";
import { readStoredWatchlist, writeStoredWatchlist } from "../../lib/storage/local-terminal";
import type { NewsEvent, TeamMarketSnapshot } from "../../types/market";
import { DataStatusBanner } from "../data/DataStatusBanner";
import { formatChange, formatProbability, formatVolume, getChangeTone } from "../home/market-formatters";

type FeedItemType =
  | "Probability Move"
  | "News Impact"
  | "Volume Spike"
  | "Odds Mismatch"
  | "Sentiment Shift";

interface FeedItem {
  id: string;
  type: FeedItemType;
  teamId: string;
  teamName: string;
  teamCode: string;
  title: string;
  probabilityChange: number;
  interpretation: string;
  confidence: number;
  valueLabel: string;
  tone: "positive" | "negative" | "neutral";
}

interface FeedPageProps {
  snapshots: TeamMarketSnapshot[];
  newsEvents: NewsEvent[];
  dataStatus: MarketDataMeta;
}

export function FeedPage({ snapshots, newsEvents, dataStatus }: FeedPageProps) {
  const [watchlistIds, setWatchlistIds] = useState<string[]>([]);
  const feedItems = useMemo(() => createFeedItems(snapshots, newsEvents), [snapshots, newsEvents]);

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
            <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.22em] text-terminal-muted">
              <Link href="/" className="hover:text-terminal-cyan">
                Market
              </Link>
              <Link href="/bid" className="hover:text-terminal-cyan">
                Mock bid
              </Link>
              <Link href="/watchlist" className="hover:text-terminal-cyan">
                Watchlist
              </Link>
            </div>
            <p className="mt-8 text-[10px] uppercase tracking-[0.28em] text-terminal-cyan">Signal feed</p>
            <h1 className="mt-4 font-display text-5xl leading-none text-terminal-text sm:text-7xl lg:text-6xl">
              Feed Page
            </h1>
            <p className="mt-5 text-sm leading-7 text-terminal-muted">
              A consumer-readable tape of market moves, news impact, volume pressure, odds divergence,
              and sentiment shifts. Each card focuses on one signal.
            </p>
            <div className="mt-7 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <FeedMetric label="Signals" value={String(feedItems.length)} />
              <FeedMetric label="Top confidence" value={`${Math.max(...feedItems.map((item) => item.confidence))}%`} />
              <FeedMetric label="Mode" value="Mock data" />
            </div>
          </section>
        </aside>

        <section className="grid gap-5">
          <DataStatusBanner meta={dataStatus} />
          {feedItems.map((item) => (
            <FeedCard
              key={item.id}
              item={item}
              isWatching={watchlistIds.includes(item.teamId)}
              onAddToWatchlist={() => addToWatchlist(item.teamId)}
            />
          ))}
        </section>
      </div>
    </main>
  );
}

function FeedCard({
  item,
  isWatching,
  onAddToWatchlist,
}: {
  item: FeedItem;
  isWatching: boolean;
  onAddToWatchlist: () => void;
}) {
  return (
    <article className="rounded-lg border border-terminal-line bg-terminal-panel/92 p-5 shadow-terminal transition duration-200 hover:border-terminal-cyan/55 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className={getTypeClassName(item.type)}>{item.type}</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-terminal-muted">{item.teamCode}</span>
          </div>
          <h2 className="mt-4 text-2xl font-semibold leading-tight text-terminal-text">{item.title}</h2>
        </div>
        <div className="rounded-lg border border-terminal-line bg-terminal-panel2/80 px-4 py-3 text-right">
          <p className="text-[10px] uppercase tracking-[0.18em] text-terminal-muted">Confidence</p>
          <p className="mt-1 text-lg font-semibold text-terminal-text">{item.confidence}%</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg border border-terminal-line bg-terminal-panel2/75 p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-terminal-muted">Related team</p>
          <p className="mt-2 text-lg font-semibold text-terminal-text">{item.teamName}</p>
          <p className={`mt-3 text-sm font-semibold ${getChangeTone(item.probabilityChange)}`}>
            {formatChange(item.probabilityChange)} probability change
          </p>
          <p className="mt-2 text-xs text-terminal-muted">{item.valueLabel}</p>
        </div>
        <div className="rounded-lg border border-terminal-line bg-terminal-panel2/75 p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-terminal-muted">Signal read</p>
          <p className="mt-2 text-sm leading-6 text-terminal-muted">{item.interpretation}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3 border-t border-terminal-line/70 pt-5">
        <Link
          href={`/team/${item.teamId}`}
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
          href="/"
          className="rounded border border-terminal-line bg-terminal-panel2 px-3 py-2 text-xs font-semibold text-terminal-muted transition hover:border-terminal-cyan/60 hover:text-terminal-cyan"
        >
          Explore Market
        </Link>
      </div>
    </article>
  );
}

function createFeedItems(snapshots: TeamMarketSnapshot[], newsEvents: NewsEvent[]): FeedItem[] {
  const probabilityMoves = getTopMovers(snapshots, 4).map((snapshot): FeedItem => ({
    id: `feed-probability-${snapshot.team.id}`,
    type: "Probability Move",
    teamId: snapshot.team.id,
    teamName: snapshot.team.name,
    teamCode: snapshot.team.code,
    title: `${snapshot.team.name} is being repriced higher`,
    probabilityChange: snapshot.market.change24h,
    interpretation: `The market moved ${formatChange(
      snapshot.market.change24h,
    )} in 24h, suggesting attention has shifted toward ${snapshot.team.name} relative to yesterday.`,
    confidence: confidenceFromMagnitude(snapshot.market.change24h, 1.2, 88),
    valueLabel: `Current probability ${formatProbability(snapshot.market.probability)}`,
    tone: "positive",
  }));

  const newsImpact = newsEvents.slice(0, 5).map((event): FeedItem => {
    const snapshot = findSnapshot(snapshots, event.teamId);
    const positive = event.impactScore >= 0;

    return {
      id: `feed-news-${event.id}`,
      type: "News Impact",
      teamId: snapshot.team.id,
      teamName: snapshot.team.name,
      teamCode: snapshot.team.code,
      title: event.headline,
      probabilityChange: snapshot.market.change24h,
      interpretation: `${event.summary} The signal is framed as market context, not a causal claim or recommendation.`,
      confidence: Math.min(91, Math.max(55, Math.abs(event.impactScore))),
      valueLabel: `News impact ${positive ? "+" : ""}${event.impactScore}`,
      tone: positive ? "positive" : "negative",
    };
  });

  const volumeSpikes = [...snapshots]
    .sort((a, b) => b.market.volume - a.market.volume)
    .slice(0, 4)
    .map((snapshot): FeedItem => ({
      id: `feed-volume-${snapshot.team.id}`,
      type: "Volume Spike",
      teamId: snapshot.team.id,
      teamName: snapshot.team.name,
      teamCode: snapshot.team.code,
      title: `${snapshot.team.name} volume is crowding the board`,
      probabilityChange: snapshot.market.change24h,
      interpretation: `${formatVolume(
        snapshot.market.volume,
      )} in mock volume makes this one of the most watched markets on the board right now.`,
      confidence: confidenceFromVolume(snapshot.market.volume),
      valueLabel: `Volume ${formatVolume(snapshot.market.volume)}`,
      tone: snapshot.market.change24h >= 0 ? "positive" : "negative",
    }));

  const oddsMismatches = getOddsMismatch(snapshots, 4).map((result): FeedItem => ({
    id: `feed-odds-${result.team.id}`,
    type: "Odds Mismatch",
    teamId: result.team.id,
    teamName: result.team.name,
    teamCode: result.team.code,
    title: `${result.team.name} market and bookmaker pricing diverge`,
    probabilityChange: result.market.change24h,
    interpretation: `Market probability is ${Math.abs(result.mismatch).toFixed(
      1,
    )} pts ${result.marketIsHigherThanBookmaker ? "above" : "below"} bookmaker implied probability.`,
    confidence: confidenceFromMagnitude(result.mismatch, 1.2, 90),
    valueLabel: `Spread ${formatChange(result.mismatch)}`,
    tone: result.mismatch >= 0 ? "positive" : "negative",
  }));

  const sentimentShifts = snapshots
    .filter((snapshot) => snapshot.market.sentiment === "volatile" || Math.abs(snapshot.market.change7d) >= 2.5)
    .slice(0, 5)
    .map((snapshot): FeedItem => ({
      id: `feed-sentiment-${snapshot.team.id}`,
      type: "Sentiment Shift",
      teamId: snapshot.team.id,
      teamName: snapshot.team.name,
      teamCode: snapshot.team.code,
      title: `${snapshot.team.name} sentiment is shifting ${snapshot.market.change7d >= 0 ? "up" : "down"}`,
      probabilityChange: snapshot.market.change7d,
      interpretation: `The 7d move is ${formatChange(
        snapshot.market.change7d,
      )} with ${snapshot.market.sentiment} sentiment, making this a change in tone rather than just a one-day tick.`,
      confidence: confidenceFromMagnitude(snapshot.market.change7d, 2, 86),
      valueLabel: `Sentiment ${snapshot.market.sentiment}`,
      tone: snapshot.market.change7d >= 0 ? "positive" : "negative",
    }));

  return [...probabilityMoves, ...newsImpact, ...volumeSpikes, ...oddsMismatches, ...sentimentShifts]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 18);
}

function findSnapshot(snapshots: TeamMarketSnapshot[], teamId: string): TeamMarketSnapshot {
  const snapshot = snapshots.find((item) => item.team.id === teamId);

  if (!snapshot) {
    throw new Error(`Missing feed snapshot for team: ${teamId}`);
  }

  return snapshot;
}

function confidenceFromMagnitude(value: number, baseline: number, cap: number): number {
  return Math.min(cap, Math.round(52 + (Math.abs(value) / baseline) * 18));
}

function confidenceFromVolume(volume: number): number {
  return Math.min(92, Math.round(58 + volume / 650000));
}

function FeedMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-terminal-line bg-terminal-panel2/80 p-5">
      <p className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-terminal-text">{value}</p>
    </div>
  );
}

function getTypeClassName(type: FeedItemType): string {
  const base = "rounded border px-2.5 py-1 text-[10px] uppercase tracking-[0.2em]";

  switch (type) {
    case "Probability Move":
      return `${base} border-terminal-green/60 text-terminal-green`;
    case "News Impact":
      return `${base} border-terminal-cyan/60 text-terminal-cyan`;
    case "Volume Spike":
      return `${base} border-terminal-amber/60 text-terminal-amber`;
    case "Odds Mismatch":
      return `${base} border-terminal-red/60 text-terminal-red`;
    case "Sentiment Shift":
      return `${base} border-terminal-line text-terminal-muted`;
  }
}
