import Link from "next/link";

import type { MarketDataMeta } from "../../data/providers/types";
import { getMarketDataSourceLabel } from "../../data/providers/source";
import {
  generateMarketSignals,
  getBiggestLosers,
  getHotTeams,
  getOddsMismatch,
  getTopMovers,
} from "../../lib/market/analyzer";
import type { MarketSignal, NewsEvent, TeamMarketSnapshot } from "../../types/market";
import { DataSourceSwitch } from "../data/DataSourceSwitch";
import { DataStatusBanner } from "../data/DataStatusBanner";
import { TeamMarketCard } from "./TeamMarketCard";
import { formatChange, formatProbability, formatVolume, getChangeTone } from "./market-formatters";

interface HomePageProps {
  snapshots: TeamMarketSnapshot[];
  newsEvents: NewsEvent[];
  dataStatus: MarketDataMeta;
}

export function HomePage({ snapshots, newsEvents, dataStatus }: HomePageProps) {
  const heatmapTeams = [...snapshots].sort((a, b) => b.market.volume - a.market.volume);
  const topMovers = getTopMovers(snapshots, 4);
  const biggestLosers = getBiggestLosers(snapshots, 4);
  const hotTeams = getHotTeams(snapshots, 4);
  const oddsMismatch = getOddsMismatch(snapshots, 3);
  const marketSignals = generateMarketSignals(snapshots, newsEvents).slice(0, 6);

  return (
    <main className="terminal-grid min-h-screen px-4 py-5 sm:px-7 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1540px] flex-col gap-8 lg:gap-9">
        <TerminalTopbar snapshots={snapshots} dataStatus={dataStatus} />
        <DataStatusBanner meta={dataStatus} />
        <Hero snapshots={snapshots} hotTeams={hotTeams} dataStatus={dataStatus} />
        <MarketHeatmap teams={heatmapTeams} source={dataStatus.source} />
        <div className="grid gap-8 xl:grid-cols-2">
          <TeamSection title="Top Movers" eyebrow="24h upside repricing" teams={topMovers} />
          <TeamSection title="Biggest Losers" eyebrow="24h downside repricing" teams={biggestLosers} />
        </div>
        <MarketSignals signals={marketSignals} oddsMismatch={oddsMismatch} />
        <TerminalFooter snapshots={snapshots} dataStatus={dataStatus} />
      </div>
    </main>
  );
}

function TerminalTopbar({ snapshots, dataStatus }: { snapshots: TeamMarketSnapshot[]; dataStatus: MarketDataMeta }) {
  const totalVolume = snapshots.reduce((sum, snapshot) => sum + snapshot.market.volume, 0);
  const liveMarkets = snapshots.length;
  const strongestMove =
    getTopMovers(snapshots, 1)[0] ??
    [...snapshots].sort((a, b) => Math.abs(b.market.change24h) - Math.abs(a.market.change24h))[0];

  return (
    <header className="rounded-lg border border-white/10 bg-black/40 px-5 py-4 shadow-terminal backdrop-blur sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded border border-terminal-orange/55 bg-terminal-orange/10 font-display text-xl font-semibold text-terminal-orange shadow-[0_0_24px_rgba(255,106,42,0.22)]">
            WC
          </div>
          <div>
            <p className="terminal-label text-[10px] uppercase tracking-[0.32em] text-terminal-muted">World Cup Prediction</p>
            <p className="mt-1 font-display text-2xl font-semibold uppercase text-terminal-text">Market Terminal</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 lg:min-w-[760px] lg:flex-row lg:items-center lg:justify-end">
          <DataSourceSwitch selectedSource={dataStatus.source} />
          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[460px]">
            <TopbarMetric label="Live markets" value={String(liveMarkets)} />
            <TopbarMetric label="Market volume" value={formatVolume(totalVolume)} />
            <TopbarMetric
              label="Fastest move"
              value={strongestMove ? `${strongestMove.team.code} ${formatChange(strongestMove.market.change24h)}` : "No move yet"}
              valueClassName={strongestMove && strongestMove.market.change24h >= 0 ? "text-terminal-green" : "text-terminal-muted"}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

function TopbarMetric({
  label,
  value,
  valueClassName = "text-terminal-text",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="border-l border-terminal-line/80 pl-4">
      <p className="terminal-label text-[10px] uppercase tracking-[0.22em] text-terminal-muted">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${valueClassName}`}>{value}</p>
    </div>
  );
}

function Hero({
  snapshots,
  hotTeams,
  dataStatus,
}: {
  snapshots: TeamMarketSnapshot[];
  hotTeams: ReturnType<typeof getHotTeams>;
  dataStatus: MarketDataMeta;
}) {
  const totalVolume = snapshots.reduce((sum, snapshot) => sum + snapshot.market.volume, 0);
  const leader =
    snapshots.length > 0
      ? snapshots.reduce((current, snapshot) =>
          snapshot.market.probability > current.market.probability ? snapshot : current,
        )
      : undefined;
  const hottest =
    hotTeams[0] ??
    [...snapshots].sort((a, b) => b.market.volume - a.market.volume)[0];

  return (
    <section className="overflow-hidden rounded-lg border border-terminal-line bg-terminal-panel/85 shadow-terminal">
      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.16fr_0.84fr] lg:p-9">
        <div>
          <div className="terminal-label flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.24em] text-terminal-muted">
            <span className="border border-terminal-line px-2.5 py-1">
              {getMarketDataSourceLabel(dataStatus.source)}
            </span>
            <span>Dark premium sports prediction terminal</span>
          </div>
          <h1 className="mt-7 max-w-4xl font-display text-5xl font-semibold uppercase leading-[0.86] text-terminal-text sm:text-7xl lg:text-8xl">
            See World Cup market heat before the narrative catches up.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-terminal-muted sm:text-base">
            A consumer-readable terminal for probability shifts, hot teams, fading teams, and signal
            context. It is market intelligence only, not trading or betting advice.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <HeroMetric
            label="Market leader"
            value={leader?.team.name ?? "Waiting for live board"}
            detail={leader ? formatProbability(leader.market.probability) : "provider warming up"}
          />
          <HeroMetric label="Tracked volume" value={formatVolume(totalVolume)} detail="read-only market depth" />
          <HeroMetric
            label="Hot signal"
            value={hottest?.team.code ?? "Pending"}
            detail={hotTeams[0] ? `${hotTeams[0].hotScore.toFixed(0)} heat score` : "waiting for comparative movement"}
          />
        </div>
      </div>
    </section>
  );
}

function HeroMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-terminal-line bg-terminal-panel2/80 p-5">
      <p className="terminal-label text-[10px] uppercase tracking-[0.22em] text-terminal-muted">{label}</p>
      <p className="mt-3 font-display text-3xl font-semibold uppercase leading-none text-terminal-text">{value}</p>
      <p className="mt-1 text-xs text-terminal-muted">{detail}</p>
    </div>
  );
}

function MarketHeatmap({ teams, source }: { teams: TeamMarketSnapshot[]; source: MarketDataMeta["source"] }) {
  return (
    <section className="rounded-lg border border-terminal-line bg-terminal-panel/90 p-5 shadow-terminal sm:p-7 lg:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeader
          eyebrow="Core board"
          title="Market Heatmap"
          description="Probability intensity, 24h movement, seven-day direction, and volume in one scanning surface."
        />
        <div className="flex flex-wrap gap-3 text-[10px] uppercase tracking-[0.2em] text-terminal-muted">
          <span className="rounded border border-terminal-green/40 bg-terminal-green/10 px-3 py-2 text-terminal-green">
            Rising
          </span>
          <span className="rounded border border-terminal-red/40 bg-terminal-red/10 px-3 py-2 text-terminal-red">
            Falling
          </span>
          <span className="rounded border border-terminal-orange/40 bg-terminal-orange/10 px-3 py-2 text-terminal-orange">Heat density</span>
        </div>
      </div>
      {teams.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {teams.map((snapshot) => (
            <HeatmapCell key={snapshot.team.id} snapshot={snapshot} source={source} />
          ))}
        </div>
      ) : (
        <EmptyPanel message="No teams are available from the current provider yet." />
      )}
    </section>
  );
}

function HeatmapCell({ snapshot, source }: { snapshot: TeamMarketSnapshot; source: MarketDataMeta["source"] }) {
  const { team, market } = snapshot;
  const intensity = Math.max(20, Math.min(88, market.probability * 4.8 + market.volume / 480000));
  const isRising = market.change24h >= 0;
  const movementColor = isRising ? "rgba(36, 209, 139, 0.16)" : "rgba(255, 95, 109, 0.18)";
  const glowColor = "rgba(255, 106, 42, 0.26)";
  const bars = getDensityBars(snapshot);

  return (
    <Link
      href={`/team/${team.id}?source=${source}`}
      aria-label={`Open ${team.name} team detail`}
      className="group relative min-h-[260px] overflow-hidden rounded-lg border border-terminal-line p-5 transition duration-200 hover:-translate-y-0.5 hover:border-terminal-orange/70 hover:shadow-heat"
      style={{
        background: `radial-gradient(circle at 18% 0%, ${glowColor}, transparent 34%), linear-gradient(135deg, ${movementColor}, rgba(16, 24, 35, 0.93) ${intensity}%)`,
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex h-20 items-end gap-1 px-5 opacity-70">
        {bars.map((height, index) => (
          <span
            key={`${team.id}-bar-${index}`}
            className="w-full rounded-t bg-gradient-to-t from-terminal-ember/45 via-terminal-orange/70 to-terminal-bone/80"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="terminal-label text-[10px] uppercase tracking-[0.2em] text-terminal-muted">{team.code}</p>
          <h3 className="mt-2 text-base font-semibold text-terminal-text">{team.name}</h3>
        </div>
        <p
          className={
            isRising
              ? "rounded border border-terminal-green/40 bg-terminal-green/10 px-2.5 py-1 text-sm font-semibold text-terminal-green"
              : "rounded border border-terminal-red/40 bg-terminal-red/10 px-2.5 py-1 text-sm font-semibold text-terminal-red"
          }
        >
          {formatChange(market.change24h)}
        </p>
      </div>
      <div className="relative mt-9">
        <div>
          <p className="terminal-label text-[10px] uppercase tracking-[0.18em] text-terminal-muted">Probability</p>
          <p className="mt-1 font-display text-6xl font-semibold leading-none text-terminal-bone sm:text-7xl">
            {formatProbability(market.probability)}
          </p>
        </div>
      </div>
      <div className="relative mt-8 grid grid-cols-3 gap-3 border-t border-terminal-line/70 pt-4">
        <CellMetric label="7d" value={formatChange(market.change7d)} tone={getChangeTone(market.change7d)} />
        <CellMetric label="Volume" value={formatVolume(market.volume)} />
        <CellMetric label="Sentiment" value={market.sentiment} />
      </div>
    </Link>
  );
}

function getDensityBars(snapshot: TeamMarketSnapshot): number[] {
  const seed = snapshot.team.code.charCodeAt(0) + snapshot.team.code.charCodeAt(1) + snapshot.team.code.charCodeAt(2);
  const base = Math.max(14, Math.min(86, snapshot.market.probability * 3.6 + snapshot.market.volume / 620000));

  return Array.from({ length: 24 }, (_, index) => {
    const wave = Math.sin((index + seed) * 0.72) * 18;
    const trend = snapshot.market.change24h * index * 0.75;
    return Math.max(8, Math.min(96, base + wave + trend));
  });
}

function CellMetric({
  label,
  value,
  tone = "text-terminal-text",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div>
      <p className="terminal-label text-[9px] uppercase tracking-[0.18em] text-terminal-muted">{label}</p>
      <p className={`mt-1 truncate text-xs font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function TeamSection({
  title,
  eyebrow,
  teams,
}: {
  title: string;
  eyebrow: string;
  teams: TeamMarketSnapshot[];
}) {
  return (
    <section className="rounded-lg border border-terminal-line bg-terminal-panel/88 p-5 shadow-terminal sm:p-7">
      <SectionHeader eyebrow={eyebrow} title={title} />
      {teams.length > 0 ? (
        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          {teams.map((snapshot) => (
            <TeamMarketCard key={snapshot.team.id} snapshot={snapshot} />
          ))}
        </div>
      ) : (
        <div className="mt-7">
          <EmptyPanel message="No comparable movers are available for this snapshot window." />
        </div>
      )}
    </section>
  );
}

function MarketSignals({
  signals,
  oddsMismatch,
}: {
  signals: MarketSignal[];
  oddsMismatch: ReturnType<typeof getOddsMismatch>;
}) {
  return (
    <section className="rounded-lg border border-terminal-line bg-terminal-panel/90 p-5 shadow-terminal sm:p-7 lg:p-8">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <SectionHeader
            eyebrow="Signal tape"
            title="Market Signals"
            description="Generated from movement, heat, volume, and market-bookmaker divergence."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {oddsMismatch.length > 0 ? (
              oddsMismatch.map((result) => (
                <div key={result.team.id} className="rounded-lg border border-terminal-line bg-terminal-panel2/80 p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-terminal-muted">Odds mismatch</p>
                  <p className="mt-2 text-lg font-semibold text-terminal-text">{result.team.name}</p>
                  <p className={result.mismatch > 0 ? "mt-1 text-sm text-terminal-green" : "mt-1 text-sm text-terminal-red"}>
                    {formatChange(result.mismatch)} vs bookmaker
                  </p>
                </div>
              ))
            ) : (
              <EmptyPanel message="No bookmaker divergence clears the current threshold." />
            )}
          </div>
        </div>
        <div className="grid gap-4">
          {signals.length > 0 ? (
            signals.map((signal) => (
              <article key={signal.id} className="rounded-lg border border-terminal-line bg-terminal-panel2/75 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">{signal.type}</span>
                  <span className={getSeverityClassName(signal.severity)}>{signal.severity}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-terminal-text">{signal.title}</h3>
                <p className="mt-2 text-sm leading-6 text-terminal-muted">{signal.description}</p>
              </article>
            ))
          ) : (
            <EmptyPanel message="Signals will appear after the provider accumulates comparable movement and divergence." />
          )}
        </div>
      </div>
    </section>
  );
}

function TerminalFooter({
  snapshots,
  dataStatus,
}: {
  snapshots: TeamMarketSnapshot[];
  dataStatus: MarketDataMeta;
}) {
  const latestUpdate = dataStatus.lastUpdated.slice(0, 10) || snapshots[0]?.market.updatedAt.slice(0, 10) || "Market session";

  return (
    <footer className="flex flex-col gap-3 border-t border-terminal-line/80 py-5 text-xs text-terminal-muted sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-terminal-green" />
        <span>{getMarketDataSourceLabel(dataStatus.source)} read-only board</span>
        <span>/</span>
        <span>Updated {latestUpdate}</span>
      </div>
      <p>World Cup Prediction Terminal / Homepage MVP</p>
    </footer>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.28em] text-terminal-cyan">{eyebrow}</p>
      <h2 className="mt-3 font-display text-4xl font-semibold uppercase leading-none text-terminal-text sm:text-5xl">{title}</h2>
      {description ? <p className="mt-3 max-w-2xl text-sm leading-6 text-terminal-muted">{description}</p> : null}
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

function getSeverityClassName(severity: MarketSignal["severity"]): string {
  const base = "rounded border px-2.5 py-1 text-[10px] uppercase tracking-[0.2em]";

  if (severity === "high") {
    return `${base} border-terminal-red/60 text-terminal-red`;
  }

  if (severity === "medium") {
    return `${base} border-terminal-amber/60 text-terminal-amber`;
  }

  return `${base} border-terminal-line text-terminal-muted`;
}
