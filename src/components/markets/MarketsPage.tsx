import Link from "next/link";

import type { MarketDataMeta, WorldCupMarketData } from "../../data/providers/types";
import { getMarketDataSourceLabel } from "../../data/providers/source";
import type { TeamMarketSnapshot } from "../../types/market";
import { TeamFlag } from "../teams/TeamFlag";
import { WalletMenuButton } from "../trading/WalletMenuButton";
import { formatChange, formatProbability, formatVolume, getSentimentLabel } from "../home/market-formatters";

interface MarketsPageProps {
  snapshots: TeamMarketSnapshot[];
  dataStatus: MarketDataMeta;
  universe?: WorldCupMarketData["universe"];
}

export function MarketsPage({ snapshots, dataStatus, universe }: MarketsPageProps) {
  const teams = [...snapshots].sort((a, b) => b.market.probability - a.market.probability);
  const totalVolume = universe?.totalVolume ?? teams.reduce((sum, snapshot) => sum + snapshot.market.volume, 0);
  const topMove = [...teams].sort((a, b) => Math.abs(b.market.change24h) - Math.abs(a.market.change24h))[0];

  return (
    <main className="prophet-html">
      <div className="page">
        <MarketsTopbar source={dataStatus.source} />

        <section className="markets-hero" aria-labelledby="markets-title">
          <div>
            <span className="eyebrow">World Cup markets</span>
            <h1 id="markets-title">All teams, one probability board.</h1>
            <p>
              Compare every World Cup winner market by probability, movement, volume, and order readiness. Market data is
              analytical context only.
            </p>
          </div>
          <div className="markets-summary" aria-label="Markets summary">
            <SummaryMetric label="Teams listed" value={String(teams.length)} />
            <SummaryMetric label="Total volume" value={formatVolume(totalVolume)} />
            <SummaryMetric label="Largest 24h move" value={topMove ? `${topMove.team.code} ${formatChange(topMove.market.change24h)}` : "-"} />
            <SummaryMetric label="Source" value={getMarketDataSourceLabel(dataStatus.source)} />
          </div>
        </section>

        <section className="panel markets-list-panel" aria-label="All World Cup team markets">
          <div className="panel-head">
            <h2 className="panel-title">World Cup Winner Probability</h2>
            <span className="live">{getStatusCopy(dataStatus)}</span>
          </div>

          <div className="markets-list">
            {teams.map((snapshot, index) => (
              <MarketListItem key={snapshot.team.id} snapshot={snapshot} rank={index + 1} source={dataStatus.source} />
            ))}
          </div>

          <div className="footnote">
            <span>Probability is implied by market price where provider data is available.</span>
            <span>Updated {formatUpdatedAt(dataStatus.lastUpdated)}</span>
          </div>
        </section>
      </div>
    </main>
  );
}

function MarketsTopbar({ source }: { source: MarketDataMeta["source"] }) {
  return (
    <header className="topbar">
      <Link className="brand" href={`/?source=${source}`} aria-label="Prophet home">
        <span className="mark" aria-hidden="true" />
        Prophet
      </Link>
      <nav aria-label="Primary navigation">
        <Link href={`/markets?source=${source}`} aria-current="page">Markets</Link>
        <Link href={`/matches?source=${source}`}>Matches</Link>
        <Link href={`/teams?source=${source}`}>Teams</Link>
        <Link href={`/bid?source=${source}`}>Portfolio</Link>
      </nav>
      <WalletMenuButton source={source} />
    </header>
  );
}

function MarketListItem({
  snapshot,
  rank,
  source,
}: {
  snapshot: TeamMarketSnapshot;
  rank: number;
  source: MarketDataMeta["source"];
}) {
  const { team, market } = snapshot;
  const isDown = market.change24h < 0;
  const quickBidHref = `/bid?source=${source}&team=${team.id}`;
  const detailHref = `/team/${team.id}?source=${source}`;

  return (
    <article className={isDown ? "market-row down" : "market-row"}>
      <div className="market-rank">{rank}</div>
      <div className="market-team-main">
        <TeamFlag code={team.code} name={team.name} />
        <div>
          <h3>{team.name}</h3>
          <p>
            {team.code} / {team.region}
            {team.group ? ` / Group ${team.group}` : ""}
          </p>
        </div>
      </div>

      <div className="market-probability">
        <strong>{formatProbability(market.probability)}</strong>
        <span className={isDown ? "delta down" : "delta"}>{formatChange(market.change24h)}</span>
        <div className="market-probability-bar" aria-hidden="true">
          <span style={{ width: `${Math.max(3, Math.min(100, market.probability))}%` }} />
        </div>
      </div>

      <div className="market-metrics">
        <MarketMetric label="7d" value={formatChange(market.change7d)} tone={market.change7d < 0 ? "down" : "up"} />
        <MarketMetric label="Volume" value={formatVolume(market.volume)} />
        <MarketMetric label="Liquidity" value={market.liquidity ? formatVolume(market.liquidity) : "-"} />
        <MarketMetric label="Sentiment" value={getSentimentLabel(market.sentiment)} />
      </div>

      <div className="market-actions">
        <Link className="market-quick-bid" href={quickBidHref}>
          Quick Bid
        </Link>
        <Link className="market-detail-button" href={detailHref}>
          Detail
        </Link>
      </div>
    </article>
  );
}

function MarketMetric({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className={tone === "down" ? "market-metric down" : "market-metric"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
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

function formatUpdatedAt(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "pending";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
