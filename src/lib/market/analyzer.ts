import { mockTeamMarketSnapshots } from "../../data/mock/teams";
import type { MarketSignal, SignalSeverity, TeamMarketSnapshot } from "../../types/market";

const DEFAULT_LIMIT = 5;
const ODDS_MISMATCH_THRESHOLD = 1.2;
const STRONG_MOVE_THRESHOLD = 1.5;
const HOT_TEAM_VOLUME_FLOOR = 3_000_000;

export interface OddsMismatchResult extends TeamMarketSnapshot {
  mismatch: number;
  marketIsHigherThanBookmaker: boolean;
}

export interface HotTeamResult extends TeamMarketSnapshot {
  hotScore: number;
}

export function getTopMovers(
  snapshots: TeamMarketSnapshot[] = mockTeamMarketSnapshots,
  limit = DEFAULT_LIMIT,
): TeamMarketSnapshot[] {
  return [...snapshots]
    .filter((snapshot) => snapshot.market.change24h > 0)
    .sort((a, b) => b.market.change24h - a.market.change24h)
    .slice(0, limit);
}

export function getBiggestLosers(
  snapshots: TeamMarketSnapshot[] = mockTeamMarketSnapshots,
  limit = DEFAULT_LIMIT,
): TeamMarketSnapshot[] {
  return [...snapshots]
    .filter((snapshot) => snapshot.market.change24h < 0)
    .sort((a, b) => a.market.change24h - b.market.change24h)
    .slice(0, limit);
}

export function getOddsMismatch(
  snapshots: TeamMarketSnapshot[] = mockTeamMarketSnapshots,
  limit = DEFAULT_LIMIT,
): OddsMismatchResult[] {
  return snapshots
    .map((snapshot) => {
      const mismatch = roundToTenth(
        snapshot.market.probability - snapshot.market.bookmakerImpliedProbability,
      );

      return {
        ...snapshot,
        mismatch,
        marketIsHigherThanBookmaker: mismatch > 0,
      };
    })
    .filter((result) => Math.abs(result.mismatch) >= ODDS_MISMATCH_THRESHOLD)
    .sort((a, b) => Math.abs(b.mismatch) - Math.abs(a.mismatch))
    .slice(0, limit);
}

export function getHotTeams(
  snapshots: TeamMarketSnapshot[] = mockTeamMarketSnapshots,
  limit = DEFAULT_LIMIT,
): HotTeamResult[] {
  const maxVolume = Math.max(...snapshots.map((snapshot) => snapshot.market.volume), 1);

  return snapshots
    .map((snapshot) => ({
      ...snapshot,
      hotScore: calculateHotScore(snapshot, maxVolume),
    }))
    .filter((result) => result.market.volume >= HOT_TEAM_VOLUME_FLOOR || result.hotScore >= 50)
    .sort((a, b) => b.hotScore - a.hotScore)
    .slice(0, limit);
}

export function generateMarketSignals(
  snapshots: TeamMarketSnapshot[] = mockTeamMarketSnapshots,
): MarketSignal[] {
  const createdAt = getLatestUpdatedAt(snapshots);
  const signals: MarketSignal[] = [];

  for (const snapshot of getTopMovers(snapshots, 4)) {
    signals.push({
      id: `signal-${snapshot.team.id}-top-mover`,
      teamId: snapshot.team.id,
      type: "top-mover",
      severity: getMoveSeverity(snapshot.market.change24h),
      title: `${snapshot.team.name} is gaining probability`,
      description: `Market probability is up ${formatSignedPercent(
        snapshot.market.change24h,
      )} over 24h and ${formatSignedPercent(snapshot.market.change7d)} over 7d.`,
      value: snapshot.market.change24h,
      createdAt,
    });
  }

  for (const snapshot of getBiggestLosers(snapshots, 4)) {
    signals.push({
      id: `signal-${snapshot.team.id}-biggest-loser`,
      teamId: snapshot.team.id,
      type: "biggest-loser",
      severity: getMoveSeverity(snapshot.market.change24h),
      title: `${snapshot.team.name} is being repriced lower`,
      description: `Market probability is down ${formatSignedPercent(
        Math.abs(snapshot.market.change24h),
      )} over 24h and sits at ${snapshot.market.probability.toFixed(1)}%.`,
      value: snapshot.market.change24h,
      createdAt,
    });
  }

  for (const result of getOddsMismatch(snapshots, 5)) {
    const direction = result.marketIsHigherThanBookmaker ? "above" : "below";

    signals.push({
      id: `signal-${result.team.id}-odds-mismatch`,
      teamId: result.team.id,
      type: "odds-mismatch",
      severity: getMismatchSeverity(result.mismatch),
      title: `${result.team.name} shows market-bookmaker divergence`,
      description: `Market probability is ${Math.abs(result.mismatch).toFixed(
        1,
      )} pts ${direction} bookmaker implied probability.`,
      value: result.mismatch,
      createdAt,
    });
  }

  for (const result of getHotTeams(snapshots, 4)) {
    signals.push({
      id: `signal-${result.team.id}-hot-team`,
      teamId: result.team.id,
      type: "hot-team",
      severity: result.hotScore >= 75 ? "high" : "medium",
      title: `${result.team.name} has elevated market attention`,
      description: `Hot score is ${result.hotScore.toFixed(
        0,
      )}, supported by volume of ${formatCompactNumber(result.market.volume)}.`,
      value: result.hotScore,
      createdAt,
    });
  }

  return dedupeSignals(signals).sort((a, b) => getSeverityRank(b.severity) - getSeverityRank(a.severity));
}

function calculateHotScore(snapshot: TeamMarketSnapshot, maxVolume: number): number {
  const volumeScore = (snapshot.market.volume / maxVolume) * 55;
  const probabilityScore = snapshot.market.probability * 1.2;
  const momentumScore = Math.max(snapshot.market.change24h, 0) * 7;
  const sentimentScore = getSentimentScore(snapshot.market.sentiment);

  return Math.min(100, roundToTenth(volumeScore + probabilityScore + momentumScore + sentimentScore));
}

function getSentimentScore(sentiment: TeamMarketSnapshot["market"]["sentiment"]): number {
  switch (sentiment) {
    case "bullish":
      return 12;
    case "volatile":
      return 8;
    case "neutral":
      return 3;
    case "bearish":
      return 0;
  }
}

function getMoveSeverity(change24h: number): SignalSeverity {
  const magnitude = Math.abs(change24h);

  if (magnitude >= 2) {
    return "high";
  }

  if (magnitude >= STRONG_MOVE_THRESHOLD) {
    return "medium";
  }

  return "low";
}

function getMismatchSeverity(mismatch: number): SignalSeverity {
  const magnitude = Math.abs(mismatch);

  if (magnitude >= 2.4) {
    return "high";
  }

  if (magnitude >= 1.6) {
    return "medium";
  }

  return "low";
}

function getSeverityRank(severity: SignalSeverity): number {
  switch (severity) {
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
  }
}

function dedupeSignals(signals: MarketSignal[]): MarketSignal[] {
  const seen = new Set<string>();

  return signals.filter((signal) => {
    if (seen.has(signal.id)) {
      return false;
    }

    seen.add(signal.id);
    return true;
  });
}

function getLatestUpdatedAt(snapshots: TeamMarketSnapshot[]): string {
  return snapshots.reduce<string>((latest, snapshot) => {
    if (!latest || snapshot.market.updatedAt > latest) {
      return snapshot.market.updatedAt;
    }

    return latest;
  }, new Date(0).toISOString());
}

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

function formatSignedPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)} pts`;
}

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
