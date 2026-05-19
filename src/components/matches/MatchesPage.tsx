import Link from "next/link";

import type { MarketDataMeta } from "../../data/providers/types";
import { getMarketDataSourceLabel } from "../../data/providers/source";
import { TeamFlag } from "../teams/TeamFlag";
import { PlaceBidButton } from "../trading/PlaceBidButton";
import { WalletMenuButton } from "../trading/WalletMenuButton";

type MatchTrend = "up" | "down" | "flat";
type MatchStatus = "featured" | "scheduled" | "monitoring";

interface StaticMatch {
  id: string;
  stage: string;
  venue: string;
  kickoff: string;
  status: MatchStatus;
  home: MatchTeam;
  away: MatchTeam;
  drawProbability: number;
  marketVolume: string;
  liquidity: string;
  signal: string;
  signalStrength: number;
  temperature: number;
  favoriteShift: number;
  spread: string;
}

interface MatchTeam {
  name: string;
  code: string;
  probability: number;
  change: number;
  price: string;
  form: string;
  trend: MatchTrend;
}

interface MatchesPageProps {
  source: MarketDataMeta["source"];
}

const STATIC_MATCHES: StaticMatch[] = [
  {
    id: "argentina-japan",
    stage: "Group A",
    venue: "Mexico City",
    kickoff: "Matchday 1 · 20:00",
    status: "featured",
    home: {
      name: "Argentina",
      code: "ARG",
      probability: 58,
      change: 2.1,
      price: "$0.58",
      form: "WWDWW",
      trend: "up",
    },
    away: {
      name: "Japan",
      code: "JPN",
      probability: 18,
      change: -0.8,
      price: "$0.18",
      form: "WLWWW",
      trend: "down",
    },
    drawProbability: 24,
    marketVolume: "$3.8M",
    liquidity: "$426K",
    signal: "Argentina volume rising before team news window",
    signalStrength: 84,
    temperature: 91,
    favoriteShift: 2.1,
    spread: "ARG +40 pts",
  },
  {
    id: "france-mexico",
    stage: "Group B",
    venue: "Los Angeles",
    kickoff: "Matchday 1 · 23:00",
    status: "scheduled",
    home: {
      name: "France",
      code: "FRA",
      probability: 61,
      change: -1.2,
      price: "$0.61",
      form: "WDWWW",
      trend: "down",
    },
    away: {
      name: "Mexico",
      code: "MEX",
      probability: 16,
      change: 0.6,
      price: "$0.16",
      form: "DWLWW",
      trend: "up",
    },
    drawProbability: 23,
    marketVolume: "$2.6M",
    liquidity: "$318K",
    signal: "Mexico draw side gaining shallow liquidity",
    signalStrength: 67,
    temperature: 74,
    favoriteShift: -1.2,
    spread: "FRA +45 pts",
  },
  {
    id: "brazil-croatia",
    stage: "Group C",
    venue: "Miami",
    kickoff: "Matchday 2 · 20:00",
    status: "monitoring",
    home: {
      name: "Brazil",
      code: "BRA",
      probability: 54,
      change: 1.5,
      price: "$0.54",
      form: "WWWLW",
      trend: "up",
    },
    away: {
      name: "Croatia",
      code: "CRO",
      probability: 21,
      change: -0.4,
      price: "$0.21",
      form: "DWWDL",
      trend: "down",
    },
    drawProbability: 25,
    marketVolume: "$2.2M",
    liquidity: "$285K",
    signal: "Brazil winner market repricing with match correlation",
    signalStrength: 72,
    temperature: 78,
    favoriteShift: 1.5,
    spread: "BRA +33 pts",
  },
  {
    id: "england-usa",
    stage: "Group D",
    venue: "Dallas",
    kickoff: "Matchday 2 · 23:00",
    status: "featured",
    home: {
      name: "England",
      code: "ENG",
      probability: 49,
      change: -2.4,
      price: "$0.49",
      form: "WWLDW",
      trend: "down",
    },
    away: {
      name: "United States",
      code: "USA",
      probability: 24,
      change: 1.9,
      price: "$0.24",
      form: "WDWLW",
      trend: "up",
    },
    drawProbability: 27,
    marketVolume: "$4.4M",
    liquidity: "$510K",
    signal: "USA side attracting late retail volume",
    signalStrength: 89,
    temperature: 95,
    favoriteShift: -2.4,
    spread: "ENG +25 pts",
  },
  {
    id: "spain-morocco",
    stage: "Group E",
    venue: "Toronto",
    kickoff: "Matchday 3 · 19:00",
    status: "scheduled",
    home: {
      name: "Spain",
      code: "ESP",
      probability: 52,
      change: 0.5,
      price: "$0.52",
      form: "DWWWW",
      trend: "up",
    },
    away: {
      name: "Morocco",
      code: "MAR",
      probability: 22,
      change: 0.1,
      price: "$0.22",
      form: "WWDLW",
      trend: "flat",
    },
    drawProbability: 26,
    marketVolume: "$1.9M",
    liquidity: "$240K",
    signal: "Market holding a tight draw premium",
    signalStrength: 58,
    temperature: 63,
    favoriteShift: 0.5,
    spread: "ESP +30 pts",
  },
  {
    id: "portugal-senegal",
    stage: "Group F",
    venue: "New York",
    kickoff: "Matchday 3 · 22:00",
    status: "monitoring",
    home: {
      name: "Portugal",
      code: "POR",
      probability: 47,
      change: 0.8,
      price: "$0.47",
      form: "WWWDD",
      trend: "up",
    },
    away: {
      name: "Senegal",
      code: "SEN",
      probability: 25,
      change: -0.7,
      price: "$0.25",
      form: "WLWDW",
      trend: "down",
    },
    drawProbability: 28,
    marketVolume: "$1.6M",
    liquidity: "$198K",
    signal: "Portugal move is moderate, liquidity still thin",
    signalStrength: 61,
    temperature: 66,
    favoriteShift: 0.8,
    spread: "POR +22 pts",
  },
];

export function MatchesPage({ source }: MatchesPageProps) {
  const featured = STATIC_MATCHES.filter((match) => match.status === "featured");
  const totalVolume = "$16.5M";
  const hottestMatch = [...STATIC_MATCHES].sort((a, b) => b.temperature - a.temperature)[0];
  const biggestMove = [...STATIC_MATCHES].sort((a, b) => Math.abs(b.favoriteShift) - Math.abs(a.favoriteShift))[0];

  return (
    <main className="prophet-html">
      <div className="page">
        <MatchesTopbar />

        <section className="matches-page-hero" aria-labelledby="matches-page-title">
          <div>
            <span className="eyebrow">Match market board</span>
            <h1 id="matches-page-title">Fixtures with market pressure.</h1>
            <p>
              Static preview of the match terminal: kickoff windows, implied outcomes, market volume, and movement signals
              for match-level monitoring.
            </p>
          </div>

          <div className="matches-summary" aria-label="Matches summary">
            <SummaryMetric label="Matches tracked" value={String(STATIC_MATCHES.length)} />
            <SummaryMetric label="Featured signals" value={String(featured.length)} />
            <SummaryMetric label="Match volume" value={totalVolume} />
            <SummaryMetric label="Source" value={getMarketDataSourceLabel(source)} />
          </div>
        </section>

        <section className="matches-command-grid" aria-label="Match market command center">
          <article className="panel match-feature-panel">
            <div className="panel-head">
              <h2 className="panel-title">Featured Match Pressure</h2>
              <span className="live">Static</span>
            </div>
            <FeaturedMatch match={hottestMatch} />
          </article>

          <aside className="panel match-signal-panel">
            <div className="panel-head">
              <h2 className="panel-title">Signal Queue</h2>
              <Link className="view-all" href="/markets">
                Open markets
              </Link>
            </div>
            <div className="match-signal-list">
              <SignalItem label="Hottest match" value={hottestMatch ? `${hottestMatch.home.code} / ${hottestMatch.away.code}` : "-"} detail={hottestMatch?.signal ?? "-"} tone="up" />
              <SignalItem label="Largest move" value={biggestMove ? formatSignedPts(biggestMove.favoriteShift) : "-"} detail={biggestMove ? `${biggestMove.home.name} favorite shift` : "-"} tone={biggestMove && biggestMove.favoriteShift < 0 ? "down" : "up"} />
              <SignalItem label="Liquidity watch" value="$510K" detail="England / United States has the deepest match book" tone="flat" />
              <SignalItem label="Draw premium" value="28%" detail="Portugal / Senegal has the highest draw probability" tone="flat" />
            </div>
          </aside>
        </section>

        <section className="panel matches-board-panel" aria-label="All upcoming match markets">
          <div className="panel-head">
            <h2 className="panel-title">Upcoming Match Markets</h2>
            <span className="live">Static board</span>
          </div>

          <div className="matches-board">
            {STATIC_MATCHES.map((match) => (
              <MatchMarketCard key={match.id} match={match} />
            ))}
          </div>

          <div className="footnote">
            <span>Static placeholder content until match provider data is connected.</span>
            <span>Market probabilities are exploratory context, not advice.</span>
          </div>
        </section>
      </div>
    </main>
  );
}

function MatchesTopbar() {
  return (
    <header className="topbar">
      <Link className="brand" href="/" aria-label="Prophet home">
        <span className="mark" aria-hidden="true" />
        Prophet
      </Link>
      <nav aria-label="Primary navigation">
        <Link href="/markets">Markets</Link>
        <Link href="/matches" aria-current="page">Matches</Link>
        <Link href="/teams">Teams</Link>
        <Link href="/portfolio">Portfolio</Link>
      </nav>
      <WalletMenuButton />
    </header>
  );
}

function FeaturedMatch({ match }: { match: StaticMatch | undefined }) {
  if (!match) {
    return null;
  }

  return (
    <div className="featured-match">
      <div className="featured-match-header">
        <MatchIdentity team={match.home} alignment="left" />
        <div className="featured-match-center">
          <span>{match.stage}</span>
          <strong>vs</strong>
          <small>{match.kickoff}</small>
        </div>
        <MatchIdentity team={match.away} alignment="right" />
      </div>

      <div className="match-probability-strip" aria-label="Featured match probabilities">
        <span style={{ width: `${match.home.probability}%` }} />
        <span style={{ width: `${match.drawProbability}%` }} />
        <span style={{ width: `${match.away.probability}%` }} />
      </div>

      <div className="featured-match-metrics">
        <MatchOutcome label={match.home.code} probability={match.home.probability} price={match.home.price} change={match.home.change} />
        <MatchOutcome label="Draw" probability={match.drawProbability} price={formatPrice(match.drawProbability)} change={0.2} />
        <MatchOutcome label={match.away.code} probability={match.away.probability} price={match.away.price} change={match.away.change} />
      </div>

      <div className="featured-match-footer">
        <div>
          <span>Signal</span>
          <strong>{match.signal}</strong>
        </div>
        <PlaceBidButton className="market-detail-button">
          Open order panel
        </PlaceBidButton>
      </div>
    </div>
  );
}

function MatchMarketCard({ match }: { match: StaticMatch }) {
  return (
    <article className="match-market-card">
      <div className="match-market-meta">
        <span>{match.stage}</span>
        <strong>{match.kickoff}</strong>
        <small>{match.venue}</small>
      </div>

      <div className="match-market-teams">
        <CompactTeam team={match.home} />
        <div className="match-market-vs">vs</div>
        <CompactTeam team={match.away} />
      </div>

      <div className="match-market-prices">
        <OutcomePill label={match.home.code} probability={match.home.probability} price={match.home.price} change={match.home.change} />
        <OutcomePill label="Draw" probability={match.drawProbability} price={formatPrice(match.drawProbability)} change={0.2} />
        <OutcomePill label={match.away.code} probability={match.away.probability} price={match.away.price} change={match.away.change} />
      </div>

      <div className="match-market-context">
        <MiniMetric label="Volume" value={match.marketVolume} />
        <MiniMetric label="Liquidity" value={match.liquidity} />
        <MiniMetric label="Heat" value={`${match.temperature}`} />
        <MiniMetric label="Spread" value={match.spread} />
      </div>

      <div className="match-market-bottom">
        <p>{match.signal}</p>
        <Link className="market-detail-button" href="/teams">
          Compare teams
        </Link>
      </div>
    </article>
  );
}

function MatchIdentity({ team, alignment }: { team: MatchTeam; alignment: "left" | "right" }) {
  return (
    <div className={alignment === "right" ? "match-identity right" : "match-identity"}>
      <TeamFlag code={team.code} name={team.name} />
      <div>
        <h3>{team.name}</h3>
        <p>
          {team.form} · {formatSignedPts(team.change)}
        </p>
      </div>
    </div>
  );
}

function CompactTeam({ team }: { team: MatchTeam }) {
  return (
    <div className="compact-match-team">
      <TeamFlag code={team.code} name={team.name} />
      <div>
        <strong>{team.name}</strong>
        <span className={team.trend === "down" ? "delta down" : team.trend === "up" ? "delta" : "delta flat"}>
          {formatSignedPts(team.change)}
        </span>
      </div>
    </div>
  );
}

function MatchOutcome({ label, probability, price, change }: { label: string; probability: number; price: string; change: number }) {
  return (
    <div className="match-outcome">
      <span>{label}</span>
      <strong>{probability.toFixed(0)}%</strong>
      <small>
        {price} · {formatSignedPts(change)}
      </small>
    </div>
  );
}

function OutcomePill({ label, probability, price, change }: { label: string; probability: number; price: string; change: number }) {
  return (
    <div className="outcome-pill">
      <span>{label}</span>
      <strong>{probability.toFixed(0)}%</strong>
      <small className={change < 0 ? "text-red" : ""}>
        {price} · {formatSignedPts(change)}
      </small>
    </div>
  );
}

function SignalItem({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: MatchTrend }) {
  return (
    <article className={tone === "down" ? "match-signal-item down" : tone === "up" ? "match-signal-item up" : "match-signal-item"}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="hero-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="match-mini-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatSignedPts(value: number): string {
  if (Math.abs(value) < 0.05) {
    return "0.0 pts";
  }

  return `${value > 0 ? "+" : ""}${value.toFixed(1)} pts`;
}

function formatPrice(probability: number): string {
  return `$${(probability / 100).toFixed(2)}`;
}
