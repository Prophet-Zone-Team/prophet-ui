import type { MarketSignal, NewsEvent, SignalSeverity, TeamMarketSnapshot } from "@/types/market";

export interface WatchlistAlert {
  id: string;
  teamId: string;
  teamName: string;
  title: string;
  description: string;
  severity: SignalSeverity;
  createdAt: string;
}

export interface DailyBriefMarkdownInput {
  snapshots: TeamMarketSnapshot[];
  signals: MarketSignal[];
  alerts: WatchlistAlert[];
  newsEvents: NewsEvent[];
  sourceLabel: string;
  lastUpdated: string;
}

export function createWatchlistAlerts({
  snapshots,
  newsEvents,
  signals,
  watchlistIds,
}: {
  snapshots: TeamMarketSnapshot[];
  newsEvents: NewsEvent[];
  signals: MarketSignal[];
  watchlistIds: string[];
}): WatchlistAlert[] {
  const watchedIds = new Set(watchlistIds);
  const watchedSnapshots = snapshots.filter((snapshot) => watchedIds.has(snapshot.team.id));
  const alerts: WatchlistAlert[] = [];
  const createdAt = getLatestDate(snapshots);

  for (const snapshot of watchedSnapshots) {
    const moveMagnitude = Math.abs(snapshot.market.change24h);

    if (moveMagnitude >= 1) {
      alerts.push({
        id: `watch-alert-${snapshot.team.id}-24h`,
        teamId: snapshot.team.id,
        teamName: snapshot.team.name,
        title: `${snapshot.team.name} cleared a 24h movement alert`,
        description: `Probability moved ${formatSigned(snapshot.market.change24h)} over 24h and now sits at ${snapshot.market.probability.toFixed(1)}%.`,
        severity: moveMagnitude >= 2 ? "high" : "medium",
        createdAt,
      });
    }

    if (Math.abs(snapshot.market.change7d) >= 2.5) {
      alerts.push({
        id: `watch-alert-${snapshot.team.id}-7d`,
        teamId: snapshot.team.id,
        teamName: snapshot.team.name,
        title: `${snapshot.team.name} has a 7d repricing alert`,
        description: `The seven-day move is ${formatSigned(snapshot.market.change7d)}, which is large enough to review in context.`,
        severity: Math.abs(snapshot.market.change7d) >= 4 ? "high" : "medium",
        createdAt,
      });
    }
  }

  for (const signal of signals.filter((item) => watchedIds.has(item.teamId)).slice(0, 8)) {
    const snapshot = snapshots.find((item) => item.team.id === signal.teamId);

    alerts.push({
      id: `watch-alert-${signal.id}`,
      teamId: signal.teamId,
      teamName: snapshot?.team.name ?? signal.teamId,
      title: signal.title,
      description: signal.shortDescription,
      severity: signal.severity,
      createdAt: signal.createdAt,
    });
  }

  for (const event of newsEvents.filter((item) => watchedIds.has(item.teamId)).slice(0, 8)) {
    const snapshot = snapshots.find((item) => item.team.id === event.teamId);

    alerts.push({
      id: `watch-alert-${event.id}`,
      teamId: event.teamId,
      teamName: snapshot?.team.name ?? event.teamId,
      title: event.headline,
      description: `${event.summary} This is news context, not a causal claim.`,
      severity: Math.abs(event.impactScore) >= 70 ? "high" : Math.abs(event.impactScore) >= 45 ? "medium" : "low",
      createdAt: event.publishedAt,
    });
  }

  return dedupeAlerts(alerts)
    .sort((a, b) => getSeverityRank(b.severity) - getSeverityRank(a.severity) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 12);
}

export function createDailyBriefMarkdown({
  snapshots,
  signals,
  alerts,
  newsEvents,
  sourceLabel,
  lastUpdated,
}: DailyBriefMarkdownInput): string {
  const topMovers = [...snapshots]
    .filter((snapshot) => snapshot.market.change24h > 0)
    .sort((a, b) => b.market.change24h - a.market.change24h)
    .slice(0, 5);
  const biggestLosers = [...snapshots]
    .filter((snapshot) => snapshot.market.change24h < 0)
    .sort((a, b) => a.market.change24h - b.market.change24h)
    .slice(0, 5);
  const oddsMismatch = signals.filter((signal) => signal.type === "odds_mismatch").slice(0, 5);

  return [
    "# World Cup Prediction Terminal Daily Brief",
    "",
    `Source: ${sourceLabel}`,
    `Updated: ${lastUpdated}`,
    "",
    "This brief is market context only. It is not betting, gambling, trading, or financial advice.",
    "",
    "## Today's Biggest Movers",
    ...formatSnapshotBullets(topMovers),
    "",
    "## Biggest Losers",
    ...formatSnapshotBullets(biggestLosers),
    "",
    "## Top Market Signals",
    ...formatSignalBullets(signals.slice(0, 8)),
    "",
    "## Watchlist Alerts",
    ...formatAlertBullets(alerts),
    "",
    "## News Impact",
    ...formatNewsBullets(newsEvents.slice(0, 6)),
    "",
    "## Odds Mismatch",
    ...formatSignalBullets(oddsMismatch),
    "",
  ].join("\n");
}

function formatSnapshotBullets(snapshots: TeamMarketSnapshot[]): string[] {
  if (snapshots.length === 0) {
    return ["- No qualifying movement in the current snapshot."];
  }

  return snapshots.map(
    (snapshot) =>
      `- ${snapshot.team.name}: ${formatSigned(snapshot.market.change24h)} 24h, ${snapshot.market.probability.toFixed(1)}% probability, ${formatCompactNumber(snapshot.market.volume)} volume.`,
  );
}

function formatSignalBullets(signals: MarketSignal[]): string[] {
  if (signals.length === 0) {
    return ["- No qualifying signal in the current snapshot."];
  }

  return signals.map((signal) => `- ${signal.title}: ${signal.shortDescription} (${signal.confidence}% confidence).`);
}

function formatAlertBullets(alerts: WatchlistAlert[]): string[] {
  if (alerts.length === 0) {
    return ["- No wallet-bound favourite alerts for the connected account."];
  }

  return alerts.map((alert) => `- ${alert.teamName}: ${alert.description}`);
}

function formatNewsBullets(newsEvents: NewsEvent[]): string[] {
  if (newsEvents.length === 0) {
    return ["- No tagged news context is available for this source."];
  }

  return newsEvents.map((event) => `- ${event.headline}: ${event.summary}`);
}

function dedupeAlerts(alerts: WatchlistAlert[]): WatchlistAlert[] {
  const seen = new Set<string>();

  return alerts.filter((alert) => {
    const key = `${alert.teamId}:${alert.title}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function getLatestDate(snapshots: TeamMarketSnapshot[]): string {
  return snapshots.reduce((latest, snapshot) => {
    return snapshot.market.updatedAt > latest ? snapshot.market.updatedAt : latest;
  }, new Date(0).toISOString());
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

function formatSigned(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)} pts`;
}

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
