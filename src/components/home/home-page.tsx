import { soccerBall } from "@lucide/lab";
import { Icon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { teamDetailHref } from "@/lib/routes/team";
import { teamTradeHref } from "@/lib/routes/trade";

import type { MarketDataMeta, WorldCupMarketData } from "@/data/providers/types";
import { getMarketDataSourceLabel } from "@/data/providers/source";
import {
  generateMarketSignals,
  getBiggestLosers,
  getHotTeams,
  getTopMovers,
} from "@/lib/market/analyzer";
import type { MarketSignal, NewsEvent, SignalSeverity, TeamMarketSnapshot } from "@/types/market";
import { PlaceBidButton } from "@/components/trading/place-bid-button";
import { TeamFlag } from "@/components/teams/team-flag";
import {
  formatChange,
  formatProbability,
  formatVolume
} from "@/components/home/market-formatters";
import { PixelBlast } from "@/components/home/pixel-blast";

interface HomePageProps {
  snapshots: TeamMarketSnapshot[];
  newsEvents: NewsEvent[];
  dataStatus: MarketDataMeta;
  universe?: WorldCupMarketData["universe"];
}

export function HomePage({ snapshots, newsEvents, dataStatus, universe }: HomePageProps) {
  const sortedTeams = [...snapshots].sort((a, b) => b.market.probability - a.market.probability);
  const topMovers = getTopMovers(sortedTeams, 4);
  const biggestLosers = getBiggestLosers(sortedTeams, 4);
  const hotTeams = getHotTeams(sortedTeams, 4);
  const marketSignals = generateMarketSignals(sortedTeams, newsEvents).slice(0, 8);
  const signalTeamMap = new Map(sortedTeams.map((snapshot) => [snapshot.team.id, snapshot]));

  return (
    <>
      <Hero
        teams={sortedTeams}
        hotTeams={hotTeams}
        signals={marketSignals}
        signalTeamMap={signalTeamMap}
        dataStatus={dataStatus}
        universe={universe}
      />
      <Dashboard
        teams={sortedTeams}
        signals={marketSignals}
        signalTeamMap={signalTeamMap}
        topMovers={topMovers}
        biggestLosers={biggestLosers}
        dataStatus={dataStatus}
      />
      <MatchesSection />
      <InfoGrid />
      <Footer />
    </>
  );
}

function Hero({
  teams,
  hotTeams,
  signals,
  signalTeamMap,
  dataStatus,
  universe,
}: {
  teams: TeamMarketSnapshot[];
  hotTeams: ReturnType<typeof getHotTeams>;
  signals: MarketSignal[];
  signalTeamMap: Map<string, TeamMarketSnapshot>;
  dataStatus: MarketDataMeta;
  universe?: WorldCupMarketData["universe"];
}) {
  const leader = teams[0];
  const strongestMove = getStrongestMove(teams);
  const volumeSignal = signals.find((signal) => signal.type === "volume_spike");
  const volumeSignalTeam = volumeSignal ? signalTeamMap.get(volumeSignal.teamId) : hotTeams[0] ?? leader;
  const heroSignal = signals[0];
  const heroSignalTeam = heroSignal ? signalTeamMap.get(heroSignal.teamId) : leader;
  const trackedMarkets = universe?.trackedMarketCount ?? teams.length;
  const sourceConfidence = getAverageConfidence(signals);

  return (
    <section className="hero" aria-labelledby="hero-title">
      <PixelBlast />
      <div className="hero-copy">
        <span className="eyebrow">Prediction market terminal</span>
        <h1 id="hero-title">
          Before the news,
          <br />
          <span className="hero-title-line">
            it <span className="hero-title-gradient">moves.</span>
            <TickerStack />
          </span>
        </h1>
        <p className="hero-subcopy">
          Prophet tracks probability, volume, and team updates in one live World Cup market feed, so the first meaningful
          move is already on your screen.
        </p>
        <div className="hero-actions">
          <PlaceBidButton />
          <div className="hero-secondary-actions">
            <Link className="hero-link" href="/fifa/matches">
              View matches
              <ArrowIcon />
            </Link>
          </div>
        </div>
        <div className="hero-stats" aria-label="Prophet market summary">
          <div className="hero-stat">
            <strong>{volumeSignalTeam ? formatVolume(volumeSignalTeam.market.volume) : "-"}</strong>
            <span>{volumeSignalTeam ? `${volumeSignalTeam.team.name} current market volume` : "Volume signal pending"}</span>
          </div>
          <div className="hero-stat">
            <strong>{strongestMove ? formatChange(strongestMove.market.change24h) : "-"}</strong>
            <span>{strongestMove ? `${strongestMove.team.name} winner odds move` : "Winner odds move pending"}</span>
          </div>
          <div className="hero-stat">
            <strong>{signals.length}</strong>
            <span>Signals detected today</span>
          </div>
        </div>
      </div>

      <aside className="hero-terminal" aria-label="Live market signal terminal">
        <div className="terminal-inner">
          <div className="terminal-head">
            <div className="terminal-kicker">
              <LightningIcon />
              Live Signal Terminal
            </div>
            <span className={dataStatus.status === "live" ? "terminal-live" : "terminal-live cached"}>
              {getStatusCopy(dataStatus)}
            </span>
          </div>

          <div className="signal-hero-card">
            <div className="signal-hero-top">
              <div className="signal-team">
                <TeamFlag code={heroSignalTeam?.team.code} name={heroSignalTeam?.team.name} />
                {heroSignalTeam ? `${heroSignalTeam.team.name} winner market` : "Winner market"}
              </div>
              <div className="signal-score">
                <strong>{heroSignalTeam ? formatProbability(heroSignalTeam.market.probability) : "-"}</strong>
                <span className={heroSignalTeam && heroSignalTeam.market.change24h < 0 ? "delta down" : "delta"}>
                  {heroSignalTeam ? formatChange(heroSignalTeam.market.change24h) : "pending"}
                </span>
              </div>
            </div>
            <div className="signal-bar">
              <span style={{ width: `${heroSignalTeam ? getProbabilityWidth(heroSignalTeam.market.probability) : 8}%` }} />
            </div>
            <div className="signal-copy">
              <span>
                {heroSignal ? formatSignalType(heroSignal.type) : "Signal pending"}{" "}
                <strong>{heroSignalTeam ? formatVolume(heroSignalTeam.market.volume) : "-"}</strong>
              </span>
              <span>{heroSignal ? `${formatConfidence(heroSignal.confidence)} confidence` : "Confidence pending"}</span>
            </div>
          </div>

          <div className="terminal-list">
            {getTerminalRows(signals, teams, signalTeamMap).map((item) => (
              <Link key={item.key} className="terminal-row" href={teamDetailHref(item.snapshot.team.id)}>
                <TeamFlag code={item.snapshot.team.code} name={item.snapshot.team.name} />
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                </div>
                <div>
                  <strong>{formatProbability(item.snapshot.market.probability)}</strong>
                  <span className={item.snapshot.market.change24h < 0 ? "delta down" : "delta"}>
                    {formatChange(item.snapshot.market.change24h)}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="terminal-footer">
            <div className="terminal-metric">
              <strong>N/A</strong>
              <span>Median signal lag (not real)</span>
            </div>
            <div className="terminal-metric">
              <strong>{trackedMarkets}</strong>
              <span>Markets tracked</span>
            </div>
            <div className="terminal-metric">
              <strong>{sourceConfidence ? `${sourceConfidence}%` : "-"}</strong>
              <span>Source confidence</span>
            </div>
          </div>
        </div>
      </aside>
    </section>
  );
}

function TickerStack() {
  return (
    <div className="ticker-stack hero-title-ticker" aria-hidden="true">
      <div className="ticker-track">
        <div className="coin-row">
          <span className="coin usd">$</span>
        </div>
        <div className="coin-row">
          <span className="coin tether">T</span>
        </div>
        <div className="coin-row">%</div>
        <div className="coin-row">
          <SoccerIcon />
        </div>
        <div className="coin-row">
          <span className="coin usd">$</span>
        </div>
      </div>
    </div>
  );
}

function SoccerIcon() {
  return (
    <Icon className="soccer-icon" iconNode={soccerBall} aria-hidden="true" />
  );
}

function Dashboard({
  teams,
  signals,
  signalTeamMap,
  topMovers,
  biggestLosers,
  dataStatus,
}: {
  teams: TeamMarketSnapshot[];
  signals: MarketSignal[];
  signalTeamMap: Map<string, TeamMarketSnapshot>;
  topMovers: TeamMarketSnapshot[];
  biggestLosers: TeamMarketSnapshot[];
  dataStatus: MarketDataMeta;
}) {
  return (
    <section id="dashboard" className="dashboard" aria-label="World Cup market dashboard">
      <div className="panel probability">
        <div className="panel-head">
          <h2 id="teams-title" className="panel-title">
            World Cup Winner Probability
            <InfoIcon />
          </h2>
          <span className="live">{getStatusCopy(dataStatus)}</span>
        </div>

        <div className="teams-grid">
          {teams.slice(0, 16).map((snapshot, index) => (
            <TeamCard key={snapshot.team.id} snapshot={snapshot} rank={index + 1} />
          ))}
          {teams.length > 16 ? (
            <Link className="team-card more" href="/teams">
              <span><span className="more-number">+{teams.length - 16}</span>more teams</span>
            </Link>
          ) : null}
        </div>

        <div className="footnote">
          <span>Probabilities reflect implied chance of winning the World Cup</span>
          <span>Source: {getMarketDataSourceLabel(dataStatus.source)} prediction market data</span>
        </div>
      </div>

      <aside className="panel movement" aria-label="Highlighted movement">
        <div className="panel-head">
          <h2 className="panel-title">
            <LightningIcon />
            Highlighted Movement
          </h2>
          <Link className="view-all" href="/feed">View all</Link>
        </div>
        <div className="movement-list">
          {getMovementRows(signals, topMovers, biggestLosers, signalTeamMap).map((item) => (
            <MoveCard key={item.key} item={item} />
          ))}
        </div>
      </aside>
    </section>
  );
}

function TeamCard({
  snapshot,
  rank,
}: {
  snapshot: TeamMarketSnapshot;
  rank: number;
}) {
  const isDown = snapshot.market.change24h < 0;

  return (
    <Link
      className={isDown ? "team-card down" : "team-card"}
      href={teamDetailHref(snapshot.team.id)}
      aria-label={`Open ${snapshot.team.name} team dossier`}
    >
      <span className="rank">{rank}</span>
      <div className="team-name">
        <TeamFlag code={snapshot.team.code} name={snapshot.team.name} />
        {snapshot.team.name}
      </div>
      <div className="team-value">
        <span className="percentage">
          {formatProbability(snapshot.market.probability)}
        </span>
        <span className={isDown ? "delta down" : "delta"}></span>
      </div>
    </Link>
  );
}

interface MovementRow {
  key: string;
  snapshot: TeamMarketSnapshot;
  title: string;
  copy: string;
  meta: string;
  severity: SignalSeverity;
}

function MoveCard({ item }: { item: MovementRow }) {
  const isDown = item.snapshot.market.change24h < 0;

  return (
    <Link className="move-card" href={teamDetailHref(item.snapshot.team.id)}>
      <TeamFlag code={item.snapshot.team.code} name={item.snapshot.team.name} />
      <div>
        <h3 className={isDown ? "move-title down" : "move-title"}>{item.title}</h3>
        <p className="move-copy">{item.copy}</p>
        <div className="move-meta">
          <span>Vol: <strong>{formatVolume(item.snapshot.market.volume)}</strong></span>
          <span>
            {formatSeverity(item.severity)} confidence{" "}
            <span className={item.severity === "high" ? "bars" : "bars yellow"}><i /><i /><i /><i /></span>
          </span>
        </div>
      </div>
      <div className="move-score">
        <strong>{formatProbability(item.snapshot.market.probability)}</strong>
        <span className={isDown ? "delta down" : "delta"}>{formatChange(item.snapshot.market.change24h)}</span>
      </div>
    </Link>
  );
}

function MatchesSection() {
  return (
    <section className="panel matches" aria-labelledby="matches-title">
      <div className="section-head">
        <h2 id="matches-title">Upcoming Matches <span className="not-real">(not real)</span></h2>
        <Link className="matches-link" href="/fifa/matches">View all matches <span aria-hidden="true">›</span></Link>
      </div>
      <div className="match-grid">
        <MatchCard home="Argentina" homeCode="ARG" away="Japan" awayCode="JPN" time="Today · 20:00" odds={["58%", "24%", "18%"]} />
        <MatchCard home="France" homeCode="FRA" away="Mexico" awayCode="MEX" time="Today · 23:00" odds={["61%", "23%", "16%"]} />
        <MatchCard home="Brazil" homeCode="BRA" away="Croatia" awayCode="CRO" time="Tomorrow · 20:00" odds={["54%", "25%", "21%"]} />
        <MatchCard home="England" homeCode="ENG" away="USA" awayCode="USA" time="Tomorrow · 23:00" odds={["49%", "27%", "24%"]} />
      </div>
    </section>
  );
}

function MatchCard({
  home,
  homeCode,
  away,
  awayCode,
  time,
  odds,
}: {
  home: string;
  homeCode: string;
  away: string;
  awayCode: string;
  time: string;
  odds: [string, string, string];
}) {
  return (
    <article className="match-card">
      <div className="match-teams">
        <div className="match-team"><TeamFlag code={homeCode} name={home} />{home}</div>
        <span className="versus">vs</span>
        <div className="match-team"><TeamFlag code={awayCode} name={away} />{away}</div>
        <span className="arrow">→</span>
      </div>
      <div className="match-time">{time}</div>
      <div className="odds">
        <div className="odd"><strong>{odds[0]}</strong><span>{homeCode}</span><small>{formatMockPrice(odds[0])}</small></div>
        <div className="odd"><strong>{odds[1]}</strong><span>Draw</span><small>{formatMockPrice(odds[1])}</small></div>
        <div className="odd"><strong>{odds[2]}</strong><span>{awayCode}</span><small>{formatMockPrice(odds[2])}</small></div>
      </div>
    </article>
  );
}

function InfoGrid() {
  return (
    <section className="info-grid" aria-label="Prophet explanation and signals">
      <div className="panel">
        <h2 className="panel-title">How Prophet Works</h2>
        <div className="work-steps">
          <article className="step">
            <div className="step-icon"><TargetIcon /></div>
            <div className="step-number">1</div>
            <h3>Detect</h3>
            <p>Probability movement before headlines.</p>
          </article>
          <article className="step">
            <div className="step-icon"><MessageIcon /></div>
            <div className="step-number">2</div>
            <h3>Understand</h3>
            <p>See why the market moved.</p>
          </article>
          <article className="step">
            <div className="step-icon"><PlayIcon /></div>
            <div className="step-number">3</div>
            <h3>Bid</h3>
            <p>Act directly from Prophet.</p>
          </article>
        </div>
      </div>

      <div className="panel">
        <h2 className="panel-title">Market Signals</h2>
        <div className="signals-grid">
          <SignalTaxonomy icon={<TrendIcon />} label="Team odds movement" />
          <SignalTaxonomy icon={<BarsIcon />} label="Volume spikes" />
          <SignalTaxonomy icon={<UsersIcon />} label="Squad updates" />
          <SignalTaxonomy icon={<PlusCircleIcon />} label="Injury impact" />
          <SignalTaxonomy icon={<WeatherIcon />} label="Venue / weather shifts" />
          <SignalTaxonomy icon={<TargetSmallIcon />} label="Market mispricing" />
        </div>
      </div>

      <div className="panel">
        <h2 className="panel-title">Why Prophet</h2>
        <div className="why-list">
          <WhyItem icon={<ShieldTrendIcon />} title="Markets move before media does" copy="Track probability shifts before they become headlines." />
          <WhyItem icon={<ShieldPlusIcon />} title="Built around World Cup markets" copy="Follow teams, matches, and market movement in one clean terminal." />
          <WhyItem icon={<ExclamationIcon />} title="From signal to execution" copy="Understand the move, then place a bid directly." />
          <WhyItem icon={<HexIcon />} title="Not news. Not sportsbook. Market intelligence." copy="A new layer for event-driven information." />
        </div>
      </div>
    </section>
  );
}

function SignalTaxonomy({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="signal">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function WhyItem({ icon, title, copy }: { icon: ReactNode; title: string; copy: string }) {
  return (
    <article className="why-item">
      {icon}
      <div>
        <h3>{title}</h3>
        <p>{copy}</p>
      </div>
    </article>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <h2>World Cup first.<br />Global <span>probability-native news</span> next. </h2>
      <div className="category-row" aria-label="Future market categories">
        <Category icon={<TrophyIcon />} label="Sports" />
        <Category icon={<BuildingIcon />} label="Politics" />
        <Category icon={<BitcoinIcon />} label="Crypto" />
        <Category icon={<GlobeIcon />} label="Macro" />
        <Category icon={<ElectionIcon />} label="Elections" />
        <Category icon={<CultureIcon />} label="Culture" />
      </div>
    </footer>
  );
}

function Category({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="category">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function getTerminalRows(
  signals: MarketSignal[],
  teams: TeamMarketSnapshot[],
  signalTeamMap: Map<string, TeamMarketSnapshot>,
) {
  const fromSignals = signals
    .slice(0, 3)
    .map((signal) => {
      const snapshot = signalTeamMap.get(signal.teamId);

      if (!snapshot) {
        return undefined;
      }

      return {
        key: signal.id,
        snapshot,
        title: signal.title,
        copy: signal.shortDescription,
      };
    })
    .filter(isDefined);

  if (fromSignals.length > 0) {
    return fromSignals;
  }

  return teams.slice(0, 3).map((snapshot) => ({
    key: snapshot.team.id,
    snapshot,
    title: `${snapshot.team.name} market update`,
    copy: "Probability and volume are available from the current provider.",
  }));
}

function getMovementRows(
  signals: MarketSignal[],
  topMovers: TeamMarketSnapshot[],
  biggestLosers: TeamMarketSnapshot[],
  signalTeamMap: Map<string, TeamMarketSnapshot>,
): MovementRow[] {
  const rows = signals
    .slice(0, 3)
    .map((signal) => {
      const snapshot = signalTeamMap.get(signal.teamId);

      if (!snapshot) {
        return undefined;
      }

      return {
        key: signal.id,
        snapshot,
        title: signal.title,
        copy: signal.shortDescription,
        meta: formatSignalType(signal.type),
        severity: signal.severity,
      };
    })
    .filter(isDefined);

  if (rows.length > 0) {
    return rows;
  }

  return [...topMovers, ...biggestLosers].slice(0, 3).map((snapshot) => ({
    key: snapshot.team.id,
    snapshot,
    title: `${snapshot.team.name} ${snapshot.market.change24h < 0 ? "reprices lower" : "moves higher"}`,
    copy: `Win probability ${formatChange(snapshot.market.change24h)} in 24h`,
    meta: "24h move",
    severity: Math.abs(snapshot.market.change24h) >= 2 ? "high" : "medium",
  }));
}

function getStrongestMove(snapshots: TeamMarketSnapshot[]): TeamMarketSnapshot | undefined {
  return [...snapshots].sort((a, b) => Math.abs(b.market.change24h) - Math.abs(a.market.change24h))[0];
}

function getAverageConfidence(signals: MarketSignal[]): number | undefined {
  if (signals.length === 0) {
    return undefined;
  }

  return Math.round(signals.reduce((sum, signal) => sum + signal.confidence, 0) / signals.length);
}

function getProbabilityWidth(probability: number): number {
  return Math.max(4, Math.min(100, probability));
}

function getStatusCopy(meta: MarketDataMeta): string {
  switch (meta.status) {
    case "live":
      return "Live";
    case "partial":
      return "Partial";
    case "cached":
      return "Cached";
    case "error":
      return "Error";
    case "fallback":
      return "Fallback";
  }
}

function formatSignalType(type: MarketSignal["type"]): string {
  return type.replace(/_/g, " ");
}

function formatConfidence(confidence: number): string {
  if (confidence >= 75) {
    return "High";
  }

  if (confidence >= 55) {
    return "Medium";
  }

  return "Low";
}

function formatSeverity(severity: SignalSeverity): string {
  if (severity === "high") {
    return "High";
  }

  if (severity === "medium") {
    return "Medium";
  }

  return "Low";
}

function formatMockPrice(value: string): string {
  const percentage = Number(value.replace("%", ""));

  if (!Number.isFinite(percentage)) {
    return "$0.00";
  }

  return `$${(percentage / 100).toFixed(2)}`;
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

function ArrowIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

function LightningIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></svg>;
}

function InfoIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 17v-5M12 8h.01" /></svg>;
}

function TargetIcon() {
  return <svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="24" /><circle cx="32" cy="32" r="8" /><path d="M32 8v8M32 48v8M8 32h8M48 32h8M47 17l-6 6M17 47l6-6" /></svg>;
}

function MessageIcon() {
  return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M18 14h28a4 4 0 0 1 4 4v26a4 4 0 0 1-4 4H30l-12 8V18a4 4 0 0 1 4-4Z" /><path d="M26 26h18M26 34h12" /></svg>;
}

function PlayIcon() {
  return <svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="24" /><path d="m27 20 17 12-17 12Z" /></svg>;
}

function TrendIcon() {
  return <svg viewBox="0 0 36 36" aria-hidden="true"><path d="M4 27 13 18l6 4L31 8" /><path d="M25 8h6v6" /></svg>;
}

function BarsIcon() {
  return <svg viewBox="0 0 36 36" aria-hidden="true"><path d="M7 29V18M15 29V10M23 29V15M31 29V5" /></svg>;
}

function UsersIcon() {
  return <svg viewBox="0 0 36 36" aria-hidden="true"><path d="M8 28v-3a8 8 0 0 1 8-8h4a8 8 0 0 1 8 8v3" /><circle cx="18" cy="10" r="5" /><path d="M4 18a7 7 0 0 1 4-6M32 18a7 7 0 0 0-4-6" /></svg>;
}

function PlusCircleIcon() {
  return <svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="11" /><path d="M18 12v12M12 18h12" /></svg>;
}

function WeatherIcon() {
  return <svg viewBox="0 0 36 36" aria-hidden="true"><path d="M9 29h17a6 6 0 0 0 1-12 9 9 0 0 0-17-3 7 7 0 0 0-1 15Z" /><path d="M8 9 5 6M18 6V2M28 9l3-3" /></svg>;
}

function TargetSmallIcon() {
  return <svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="12" /><circle cx="18" cy="18" r="5" /><path d="M18 2v6M18 28v6M2 18h6M28 18h6" /></svg>;
}

function ShieldTrendIcon() {
  return <svg viewBox="0 0 36 36" aria-hidden="true"><path d="M18 3 30 8v8c0 8-5 14-12 17C11 30 6 24 6 16V8l12-5Z" /><path d="M18 22V12M18 12l5 4M18 12l-5 4" /></svg>;
}

function ShieldPlusIcon() {
  return <svg viewBox="0 0 36 36" aria-hidden="true"><path d="M18 3 30 8v8c0 8-5 14-12 17C11 30 6 24 6 16V8l12-5Z" /><path d="M18 12v9M14 17h8" /></svg>;
}

function ExclamationIcon() {
  return <svg viewBox="0 0 36 36" aria-hidden="true"><path d="M18 4v20" /><circle cx="18" cy="25" r="6" /><path d="M18 25h.01" /></svg>;
}

function HexIcon() {
  return <svg viewBox="0 0 36 36" aria-hidden="true"><path d="M18 3 31 10v16l-13 7-13-7V10l13-7Z" /><circle cx="18" cy="18" r="5" /><path d="m18 14 2 4-2 4-2-4 2-4Z" /></svg>;
}

function TrophyIcon() {
  return <svg viewBox="0 0 36 36" aria-hidden="true"><path d="M12 5h12v8a6 6 0 0 1-12 0V5Z" /><path d="M12 8H6v4a5 5 0 0 0 6 5M24 8h6v4a5 5 0 0 1-6 5M18 19v7M13 31h10M10 31h16" /></svg>;
}

function BuildingIcon() {
  return <svg viewBox="0 0 36 36" aria-hidden="true"><path d="M6 16h24M8 28h20M10 16v12M16 16v12M22 16v12M28 16v12M18 5 5 13h26L18 5Z" /></svg>;
}

function BitcoinIcon() {
  return <svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="12" /><path d="M18 10v16M14 12h6a4 4 0 0 1 0 8h-6M14 20h7a3 3 0 0 1 0 6h-7" /></svg>;
}

function GlobeIcon() {
  return <svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="13" /><path d="M5 18h26M18 5a20 20 0 0 1 0 26M18 5a20 20 0 0 0 0 26" /></svg>;
}

function ElectionIcon() {
  return <svg viewBox="0 0 36 36" aria-hidden="true"><path d="M8 15h20v16H8V15Z" /><path d="m18 5 11 10H7L18 5Z" /><path d="M14 23h8M14 27h5" /></svg>;
}

function CultureIcon() {
  return <svg viewBox="0 0 36 36" aria-hidden="true"><path d="M7 6h10v8c0 6-4 9-5 9s-5-3-5-9V6ZM19 6h10v8c0 6-4 9-5 9s-5-3-5-9V6Z" /><path d="M10 13h4M22 13h4M10 18c1 1 3 1 4 0M22 18c1 1 3 1 4 0" /></svg>;
}
