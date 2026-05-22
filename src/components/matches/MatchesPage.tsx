import Link from "next/link";

import type { MarketDataMeta } from "../../data/providers/types";
import { getMarketDataSourceLabel } from "../../data/providers/source";
import type { TeamMarketSnapshot, WorldCupMatch } from "../../types/market";
import { formatChange, formatProbability } from "../home/market-formatters";
import { TeamFlag } from "../teams/TeamFlag";
interface MatchesPageProps {
  matches: WorldCupMatch[];
  snapshots: TeamMarketSnapshot[];
  dataStatus: MarketDataMeta;
}

export function MatchesPage({ matches, snapshots, dataStatus }: MatchesPageProps) {
  const upcoming = matches.filter((match) => match.status === "scheduled").slice(0, 24);
  const finished = matches.filter((match) => match.status === "finished");
  const live = matches.filter((match) => match.status === "live");
  const featured = [...upcoming].sort((a, b) => getMatchMarketHeat(b, snapshots) - getMatchMarketHeat(a, snapshots))[0];

  return (
    <>
      <section className="matches-page-hero" aria-labelledby="matches-page-title">
          <div>
            <span className="eyebrow">World Cup Match Center</span>
            <h1 id="matches-page-title">Fixtures, results, market movement.</h1>
            <p>Official bracket structure with cached football context layered on top. Missing scores or odds are shown as unavailable, not invented.</p>
          </div>
          <div className="matches-summary" aria-label="Matches summary">
            <SummaryMetric label="Matches" value={String(matches.length)} />
            <SummaryMetric label="Live" value={String(live.length)} />
            <SummaryMetric label="Finished" value={String(finished.length)} />
            <SummaryMetric label="Market source" value={getMarketDataSourceLabel(dataStatus.source)} />
          </div>
        </section>

        {featured ? (
          <section className="panel match-feature-panel">
            <div className="panel-head">
              <h2 className="panel-title">Featured Market Match</h2>
              <span className="live">{featured.freshness.source}</span>
            </div>
            <MatchCard match={featured} snapshots={snapshots} featured />
          </section>
        ) : null}

        <section className="panel matches-board-panel" aria-label="All World Cup fixtures">
          <div className="panel-head">
            <h2 className="panel-title">World Cup Fixtures</h2>
            <span className="live">Schedule + cached status</span>
          </div>
          <div className="match-filter-row">
            <a href="#group">Group</a>
            <a href="#knockout">Knockout</a>
            <a href="#finished">Finished</a>
          </div>
          <div id="group" className="matches-board">
            {matches.filter((match) => match.stage === "GROUP").map((match) => (
              <MatchCard key={match.id} match={match} snapshots={snapshots} />
            ))}
          </div>
          <div id="knockout" className="matches-board knockout">
            {matches.filter((match) => match.stage !== "GROUP").map((match) => (
              <MatchCard key={match.id} match={match} snapshots={snapshots} />
            ))}
          </div>
          <div className="footnote">
            <span>Schedule base: official World Cup bracket configuration.</span>
            <span>Scores, odds, and lineups depend on cached provider coverage.</span>
          </div>
      </section>
    </>
  );
}

function MatchCard({ match, snapshots, featured = false }: { match: WorldCupMatch; snapshots: TeamMarketSnapshot[]; featured?: boolean }) {
  const home = match.homeTeamId ? snapshots.find((snapshot) => snapshot.team.id === match.homeTeamId) : undefined;
  const away = match.awayTeamId ? snapshots.find((snapshot) => snapshot.team.id === match.awayTeamId) : undefined;
  const movement = getMatchMovement(match, snapshots);

  return (
    <article id={match.id} className={featured ? "match-market-card featured" : "match-market-card"}>
      <div className="match-market-meta">
        <span>{match.stage}{match.group ? ` / Group ${match.group}` : ""}</span>
        <strong>{formatKickoff(match.kickoffAt)}</strong>
        <small>{match.venue ?? match.city ?? "Venue pending"}</small>
      </div>
      <div className="match-market-teams">
        <MatchTeam snapshot={home} seed={match.homeSeed} score={match.homeScore} />
        <div className="match-market-vs">{match.status === "finished" || match.status === "live" ? "score" : "vs"}</div>
        <MatchTeam snapshot={away} seed={match.awaySeed} score={match.awayScore} />
      </div>
      <div className="match-market-context">
        <MiniMetric label="Status" value={match.status} />
        <MiniMetric label="Market move" value={formatChange(movement)} />
        <MiniMetric label="Odds" value={match.odds?.status === "cached" ? "Available" : "Unavailable"} />
        <MiniMetric label="Freshness" value={match.freshness.status} />
      </div>
      {home && away ? (
        <div className="match-market-prices">
          <OutcomePill label={home.team.code} probability={home.market.probability} change={home.market.change24h} />
          <OutcomePill label="Draw" probability={0} change={0} muted />
          <OutcomePill label={away.team.code} probability={away.market.probability} change={away.market.change24h} />
        </div>
      ) : null}
      <div className="match-market-bottom">
        <p>{match.freshness.source}{match.freshness.lastUpdated ? ` / updated ${formatKickoff(match.freshness.lastUpdated)}` : ""}</p>
        {home ? <Link className="market-detail-button" href={`/team/${home.team.id}`}>View team</Link> : <Link className="market-detail-button" href="/world-cup/path-explorer">Open path</Link>}
      </div>
    </article>
  );
}

function MatchTeam({ snapshot, seed, score }: { snapshot?: TeamMarketSnapshot; seed?: string; score?: number }) {
  return (
    <div className="compact-match-team">
      {snapshot ? <TeamFlag code={snapshot.team.code} name={snapshot.team.name} /> : <span className="flag">{seed?.slice(0, 2) ?? "TBD"}</span>}
      <div>
        <strong>{snapshot?.team.name ?? seed ?? "TBD"}</strong>
        <span>{score !== undefined ? String(score) : snapshot ? formatProbability(snapshot.market.probability) : "Seed slot"}</span>
      </div>
    </div>
  );
}

function OutcomePill({ label, probability, change, muted = false }: { label: string; probability: number; change: number; muted?: boolean }) {
  return (
    <div className="outcome-pill">
      <span>{label}</span>
      <strong>{muted ? "N/A" : formatProbability(probability)}</strong>
      <small>{muted ? "Match odds pending" : formatChange(change)}</small>
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getMatchMovement(match: WorldCupMatch, snapshots: TeamMarketSnapshot[]) {
  const values = [match.homeTeamId, match.awayTeamId]
    .map((teamId) => snapshots.find((snapshot) => snapshot.team.id === teamId)?.market.change24h)
    .filter((value): value is number => Number.isFinite(value));

  return values.reduce((sum, value) => sum + Math.abs(value), 0);
}

function getMatchMarketHeat(match: WorldCupMatch, snapshots: TeamMarketSnapshot[]) {
  return [match.homeTeamId, match.awayTeamId].reduce((sum, teamId) => {
    const snapshot = snapshots.find((item) => item.team.id === teamId);
    return sum + (snapshot?.market.volume ?? 0) + Math.abs(snapshot?.market.change24h ?? 0) * 100000;
  }, 0);
}

function formatKickoff(value: string | undefined): string {
  if (!value) {
    return "TBD";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}
