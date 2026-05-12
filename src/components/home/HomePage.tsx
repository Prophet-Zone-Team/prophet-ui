import Link from "next/link";

import { mockTeamMarketSnapshots } from "../../data/mock/teams";
import {
  generateMarketSignals,
  getBiggestLosers,
  getHotTeams,
  getOddsMismatch,
  getTopMovers,
} from "../../lib/market/analyzer";
import type { MarketSignal, TeamMarketSnapshot } from "../../types/market";
import { TeamMarketCard } from "./TeamMarketCard";
import { formatChange, formatProbability, formatVolume, getChangeTone } from "./market-formatters";

const snapshots = mockTeamMarketSnapshots;
const heatmapTeams = [...snapshots].sort((a, b) => b.market.volume - a.market.volume);
const topMovers = getTopMovers(snapshots, 4);
const biggestLosers = getBiggestLosers(snapshots, 4);
const hotTeams = getHotTeams(snapshots, 4);
const oddsMismatch = getOddsMismatch(snapshots, 3);
const marketSignals = generateMarketSignals(snapshots).slice(0, 6);

export function HomePage() {
  return (
    <main className="terminal-grid min-h-screen px-4 py-5 sm:px-7 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1540px] flex-col gap-8 lg:gap-9">
        <TerminalTopbar />
        <Hero />
        <MarketHeatmap teams={heatmapTeams} />
        <div className="grid gap-8 xl:grid-cols-2">
          <TeamSection title="Top Movers" eyebrow="24h upside repricing" teams={topMovers} />
          <TeamSection title="Biggest Losers" eyebrow="24h downside repricing" teams={biggestLosers} />
        </div>
        <MarketSignals signals={marketSignals} />
        <TerminalFooter />
      </div>
    </main>
  );
}

function TerminalTopbar() {
  const totalVolume = snapshots.reduce((sum, snapshot) => sum + snapshot.market.volume, 0);
  const liveMarkets = snapshots.length;
  const strongestMove = getTopMovers(snapshots, 1)[0];

  return (
    <header className="rounded-lg border border-white/10 bg-black/35 px-5 py-4 shadow-terminal backdrop-blur sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded border border-terminal-amber/50 bg-terminal-amber/10 text-lg font-semibold text-terminal-amber">
            WC
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.32em] text-terminal-muted">World Cup Prediction</p>
            <p className="mt-1 text-lg font-semibold text-terminal-text">Market Terminal</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[620px]">
          <TopbarMetric label="Live markets" value={String(liveMarkets)} />
          <TopbarMetric label="Mock volume" value={formatVolume(totalVolume)} />
          <TopbarMetric
            label="Fastest move"
            value={`${strongestMove.team.code} ${formatChange(strongestMove.market.change24h)}`}
            valueClassName="text-terminal-green"
          />
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
      <p className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${valueClassName}`}>{value}</p>
    </div>
  );
}

function Hero() {
  const totalVolume = snapshots.reduce((sum, snapshot) => sum + snapshot.market.volume, 0);
  const leader = snapshots.reduce((current, snapshot) =>
    snapshot.market.probability > current.market.probability ? snapshot : current,
  );
  const hottest = hotTeams[0];

  return (
    <section className="overflow-hidden rounded-lg border border-terminal-line bg-terminal-panel/85 shadow-terminal">
      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.16fr_0.84fr] lg:p-9">
        <div>
          <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.24em] text-terminal-muted">
            <span className="border border-terminal-line px-2.5 py-1">Mock market</span>
            <span>Dark premium sports prediction terminal</span>
          </div>
          <h1 className="mt-7 max-w-4xl font-display text-4xl leading-[0.95] text-terminal-text sm:text-6xl lg:text-7xl">
            See World Cup market heat before the narrative catches up.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-terminal-muted sm:text-base">
            A consumer-readable terminal for probability shifts, hot teams, fading teams, and signal
            context. It is market intelligence only, not trading or betting advice.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <HeroMetric label="Market leader" value={leader.team.name} detail={formatProbability(leader.market.probability)} />
          <HeroMetric label="Tracked volume" value={formatVolume(totalVolume)} detail="mock market depth" />
          <HeroMetric label="Hot signal" value={hottest.team.code} detail={`${hottest.hotScore.toFixed(0)} heat score`} />
        </div>
      </div>
    </section>
  );
}

function HeroMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-terminal-line bg-terminal-panel2/80 p-5">
      <p className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-terminal-text">{value}</p>
      <p className="mt-1 text-xs text-terminal-muted">{detail}</p>
    </div>
  );
}

function MarketHeatmap({ teams }: { teams: TeamMarketSnapshot[] }) {
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
          <span className="rounded border border-terminal-line bg-terminal-panel2 px-3 py-2">Mock data</span>
        </div>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {teams.map((snapshot) => (
          <HeatmapCell key={snapshot.team.id} snapshot={snapshot} />
        ))}
      </div>
    </section>
  );
}

function HeatmapCell({ snapshot }: { snapshot: TeamMarketSnapshot }) {
  const { team, market } = snapshot;
  const intensity = Math.max(20, Math.min(88, market.probability * 4.8 + market.volume / 480000));
  const isRising = market.change24h >= 0;
  const movementColor = isRising ? "rgba(36, 209, 139, 0.25)" : "rgba(255, 95, 109, 0.24)";
  const glowColor = isRising ? "rgba(36, 209, 139, 0.22)" : "rgba(255, 95, 109, 0.2)";
  const bars = getDensityBars(snapshot);

  return (
    <Link
      href={`/team/${team.id}`}
      aria-label={`Open ${team.name} team detail`}
      className="group relative min-h-[260px] overflow-hidden rounded-lg border border-terminal-line p-5 transition duration-200 hover:-translate-y-0.5 hover:border-terminal-cyan/60 hover:shadow-[0_0_36px_rgba(87,199,255,0.12)]"
      style={{
        background: `radial-gradient(circle at 18% 0%, ${glowColor}, transparent 34%), linear-gradient(135deg, ${movementColor}, rgba(16, 24, 35, 0.93) ${intensity}%)`,
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex h-20 items-end gap-1 px-5 opacity-60">
        {bars.map((height, index) => (
          <span
            key={`${team.id}-bar-${index}`}
            className={isRising ? "w-full rounded-t bg-terminal-green/70" : "w-full rounded-t bg-terminal-red/70"}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-terminal-muted">{team.code}</p>
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
          <p className="text-[10px] uppercase tracking-[0.18em] text-terminal-muted">Probability</p>
          <p className="mt-1 text-5xl font-semibold leading-none text-terminal-text sm:text-6xl">
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
      <p className="text-[9px] uppercase tracking-[0.18em] text-terminal-muted">{label}</p>
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
      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        {teams.map((snapshot) => (
          <TeamMarketCard key={snapshot.team.id} snapshot={snapshot} />
        ))}
      </div>
    </section>
  );
}

function MarketSignals({ signals }: { signals: MarketSignal[] }) {
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
            {oddsMismatch.map((result) => (
              <div key={result.team.id} className="rounded-lg border border-terminal-line bg-terminal-panel2/80 p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-terminal-muted">Odds mismatch</p>
                <p className="mt-2 text-lg font-semibold text-terminal-text">{result.team.name}</p>
                <p className={result.mismatch > 0 ? "mt-1 text-sm text-terminal-green" : "mt-1 text-sm text-terminal-red"}>
                  {formatChange(result.mismatch)} vs bookmaker
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-4">
          {signals.map((signal) => (
            <article key={signal.id} className="rounded-lg border border-terminal-line bg-terminal-panel2/75 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">{signal.type}</span>
                <span className={getSeverityClassName(signal.severity)}>{signal.severity}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-terminal-text">{signal.title}</h3>
              <p className="mt-2 text-sm leading-6 text-terminal-muted">{signal.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function TerminalFooter() {
  const latestUpdate = snapshots[0]?.market.updatedAt.slice(0, 10) ?? "Mock session";

  return (
    <footer className="flex flex-col gap-3 border-t border-terminal-line/80 py-5 text-xs text-terminal-muted sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-terminal-green" />
        <span>Mock data live board</span>
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
      <h2 className="mt-3 font-display text-3xl text-terminal-text sm:text-4xl">{title}</h2>
      {description ? <p className="mt-3 max-w-2xl text-sm leading-6 text-terminal-muted">{description}</p> : null}
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
