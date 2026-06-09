import type { MarketSignal, NewsEvent, SignalSeverity, TeamMarketSnapshot } from "@/types/market";

const DEFAULT_LIMIT = 5;
const ODDS_MISMATCH_THRESHOLD = 1.2;
const EPSILON = 0.05;
const HEATING_MOVE_THRESHOLD = 0.8;
const COOLING_MOVE_THRESHOLD = -0.8;
const OVERHEATED_MOVE_THRESHOLD = 2;
const QUIET_MOVE_MIN = 0.2;
const QUIET_MOVE_MAX = 1.2;
const VOLUME_SPIKE_RATIO = 0.72;
const HOT_TEAM_VOLUME_FLOOR = 3_000_000;

export interface OddsMismatchResult extends TeamMarketSnapshot {
  mismatch: number;
  marketIsHigherThanBookmaker: boolean;
}

export interface HotTeamResult extends TeamMarketSnapshot {
  hotScore: number;
}

interface SignalCandidate extends MarketSignal {
  score: number;
}

export function getTopMovers(
  snapshots: TeamMarketSnapshot[],
  limit = DEFAULT_LIMIT,
): TeamMarketSnapshot[] {
  return [...snapshots]
    .filter((snapshot) => snapshot.market.change24h > 0)
    .sort((a, b) => b.market.change24h - a.market.change24h)
    .slice(0, limit);
}

export function getBiggestLosers(
  snapshots: TeamMarketSnapshot[],
  limit = DEFAULT_LIMIT,
): TeamMarketSnapshot[] {
  return [...snapshots]
    .filter((snapshot) => snapshot.market.change24h < 0)
    .sort((a, b) => a.market.change24h - b.market.change24h)
    .slice(0, limit);
}

export function getOddsMismatch(
  snapshots: TeamMarketSnapshot[],
  limit = DEFAULT_LIMIT,
): OddsMismatchResult[] {
  return snapshots
    .filter((snapshot) => Math.abs(snapshot.market.probability - snapshot.market.bookmakerImpliedProbability) > EPSILON)
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
  snapshots: TeamMarketSnapshot[],
  limit = DEFAULT_LIMIT,
): HotTeamResult[] {
  const maxVolume = getMaxVolume(snapshots);

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
  snapshots: TeamMarketSnapshot[],
  newsEvents: NewsEvent[] = [],
): MarketSignal[] {
  const createdAt = getLatestUpdatedAt(snapshots);
  const maxVolume = getMaxVolume(snapshots);
  const medianVolume = getMedianVolume(snapshots);
  const signals: SignalCandidate[] = [];

  for (const snapshot of snapshots) {
    const volumeRatio = snapshot.market.volume / maxVolume;
    const volumeIsElevated = snapshot.market.volume >= medianVolume * 1.2 || volumeRatio >= 0.45;

    if (snapshot.market.change24h >= HEATING_MOVE_THRESHOLD && volumeIsElevated) {
      signals.push(createHeatingUpSignal(snapshot, createdAt, volumeRatio));
    }

    if (snapshot.market.change24h <= COOLING_MOVE_THRESHOLD && volumeIsElevated) {
      signals.push(createCoolingDownSignal(snapshot, createdAt, volumeRatio));
    }

    if (volumeRatio >= VOLUME_SPIKE_RATIO || snapshot.market.volume >= medianVolume * 1.8) {
      signals.push(createVolumeSpikeSignal(snapshot, createdAt, volumeRatio));
    }

    if (
      snapshot.market.change24h >= OVERHEATED_MOVE_THRESHOLD &&
      snapshot.market.sentiment === "bullish" &&
      volumeIsElevated
    ) {
      signals.push(createOverheatedSignal(snapshot, createdAt, volumeRatio));
    }

    if (
      snapshot.market.change24h >= QUIET_MOVE_MIN &&
      snapshot.market.change24h <= QUIET_MOVE_MAX &&
      snapshot.market.change7d >= 1.2 &&
      snapshot.market.volume >= medianVolume * 0.75
    ) {
      signals.push(createQuietAccumulationSignal(snapshot, createdAt, volumeRatio));
    }

    if (snapshot.market.sentiment === "volatile" && Math.abs(snapshot.market.change7d) >= 1.5) {
      signals.push(createSentimentDrivenSignal(snapshot, createdAt));
    }
  }

  for (const mismatch of getOddsMismatch(snapshots, snapshots.length)) {
    signals.push(createOddsMismatchSignal(mismatch, createdAt));
  }

  for (const newsEvent of newsEvents) {
    const snapshot = snapshots.find((item) => item.team.id === newsEvent.teamId);

    if (snapshot) {
      signals.push(createNewsImpactSignal(snapshot, newsEvent, createdAt));
    }
  }

  return dedupeSignals(signals)
    .sort((a, b) => b.score - a.score)
    .map(({ score: _score, ...signal }) => signal);
}

function createHeatingUpSignal(
  snapshot: TeamMarketSnapshot,
  createdAt: string,
  volumeRatio: number,
): SignalCandidate {
  const confidence = confidenceFromParts(50, Math.abs(snapshot.market.change24h) * 12, volumeRatio * 22);

  return {
    id: `signal-${snapshot.team.id}-heating-up`,
    teamId: snapshot.team.id,
    type: "heating_up",
    severity: getMoveSeverity(snapshot.market.change24h),
    title: `${snapshot.team.name} is heating up`,
    shortDescription: `Probability rose ${formatSignedPercent(snapshot.market.change24h)} while market activity stayed elevated.`,
    explanation:
      "A positive probability move with meaningful volume usually means attention is broadening, not just a quiet price tick.",
    confidence,
    dataPoints: [
      dataPoint("24h move", formatSignedPercent(snapshot.market.change24h), "positive"),
      dataPoint("Volume", formatCompactNumber(snapshot.market.volume), "neutral"),
      dataPoint("7d move", formatSignedPercent(snapshot.market.change7d), getTone(snapshot.market.change7d)),
    ],
    createdAt,
    score: scoreSignal("medium", confidence, Math.abs(snapshot.market.change24h)),
  };
}

function createCoolingDownSignal(
  snapshot: TeamMarketSnapshot,
  createdAt: string,
  volumeRatio: number,
): SignalCandidate {
  const confidence = confidenceFromParts(50, Math.abs(snapshot.market.change24h) * 12, volumeRatio * 22);

  return {
    id: `signal-${snapshot.team.id}-cooling-down`,
    teamId: snapshot.team.id,
    type: "cooling_down",
    severity: getMoveSeverity(snapshot.market.change24h),
    title: `${snapshot.team.name} is cooling down`,
    shortDescription: `Probability fell ${formatSignedPercent(snapshot.market.change24h)} with enough volume to make the move visible.`,
    explanation:
      "A downside move with active volume suggests the market is repricing uncertainty rather than simply going quiet.",
    confidence,
    dataPoints: [
      dataPoint("24h move", formatSignedPercent(snapshot.market.change24h), "negative"),
      dataPoint("Volume", formatCompactNumber(snapshot.market.volume), "neutral"),
      dataPoint("7d move", formatSignedPercent(snapshot.market.change7d), getTone(snapshot.market.change7d)),
    ],
    createdAt,
    score: scoreSignal("medium", confidence, Math.abs(snapshot.market.change24h)),
  };
}

function createVolumeSpikeSignal(
  snapshot: TeamMarketSnapshot,
  createdAt: string,
  volumeRatio: number,
): SignalCandidate {
  const confidence = confidenceFromParts(54, volumeRatio * 34, Math.abs(snapshot.market.change24h) * 4);

  return {
    id: `signal-${snapshot.team.id}-volume-spike`,
    teamId: snapshot.team.id,
    type: "volume_spike",
    severity: volumeRatio >= 0.85 ? "high" : "medium",
    title: `${snapshot.team.name} is crowding the volume board`,
    shortDescription: `${formatCompactNumber(snapshot.market.volume)} in reported volume puts this team near the top of current attention.`,
    explanation:
      "Volume spikes help separate markets people are actively watching from teams that only moved on thin activity.",
    confidence,
    dataPoints: [
      dataPoint("Volume", formatCompactNumber(snapshot.market.volume), "neutral"),
      dataPoint("Board rank", `${Math.round(volumeRatio * 100)}% of leader`, "neutral"),
      dataPoint("24h move", formatSignedPercent(snapshot.market.change24h), getTone(snapshot.market.change24h)),
    ],
    createdAt,
    score: scoreSignal(volumeRatio >= 0.85 ? "high" : "medium", confidence, volumeRatio * 3),
  };
}

function createOddsMismatchSignal(result: OddsMismatchResult, createdAt: string): SignalCandidate {
  const direction = result.marketIsHigherThanBookmaker ? "above" : "below";
  const confidence = confidenceFromParts(55, Math.abs(result.mismatch) * 12);

  return {
    id: `signal-${result.team.id}-odds-mismatch`,
    teamId: result.team.id,
    type: "odds_mismatch",
    severity: getMismatchSeverity(result.mismatch),
    title: `${result.team.name} shows pricing divergence`,
    shortDescription: `Market probability is ${Math.abs(result.mismatch).toFixed(1)} pts ${direction} the comparison price.`,
    explanation:
      "Divergence can point to different pricing assumptions across sources. It is useful context, not a reason to take a position.",
    confidence,
    dataPoints: [
      dataPoint("Market", `${result.market.probability.toFixed(1)}%`, "neutral"),
      dataPoint("Comparison", `${result.market.bookmakerImpliedProbability.toFixed(1)}%`, "neutral"),
      dataPoint("Spread", formatSignedPercent(result.mismatch), getTone(result.mismatch)),
    ],
    createdAt,
    score: scoreSignal(getMismatchSeverity(result.mismatch), confidence, Math.abs(result.mismatch)),
  };
}

function createSentimentDrivenSignal(snapshot: TeamMarketSnapshot, createdAt: string): SignalCandidate {
  const confidence = confidenceFromParts(50, Math.abs(snapshot.market.change7d) * 8, Math.abs(snapshot.market.change24h) * 5);

  return {
    id: `signal-${snapshot.team.id}-sentiment-driven`,
    teamId: snapshot.team.id,
    type: "sentiment_driven",
    severity: Math.abs(snapshot.market.change7d) >= 3 ? "high" : "medium",
    title: `${snapshot.team.name} is sentiment driven`,
    shortDescription: `The 7d move is ${formatSignedPercent(snapshot.market.change7d)} with volatile market sentiment.`,
    explanation:
      "Sentiment-driven moves can be useful to monitor because attention may be moving faster than stable probability consensus.",
    confidence,
    dataPoints: [
      dataPoint("Sentiment", snapshot.market.sentiment, "neutral"),
      dataPoint("7d move", formatSignedPercent(snapshot.market.change7d), getTone(snapshot.market.change7d)),
      dataPoint("24h move", formatSignedPercent(snapshot.market.change24h), getTone(snapshot.market.change24h)),
    ],
    createdAt,
    score: scoreSignal("medium", confidence, Math.abs(snapshot.market.change7d)),
  };
}

function createNewsImpactSignal(
  snapshot: TeamMarketSnapshot,
  newsEvent: NewsEvent,
  createdAt: string,
): SignalCandidate {
  const impactTone = newsEvent.impactScore >= 0 ? "positive" : "negative";
  const confidence = Math.min(92, Math.max(55, Math.round(48 + Math.abs(newsEvent.impactScore) * 0.55)));

  return {
    id: `signal-${snapshot.team.id}-news-impact-${newsEvent.id}`,
    teamId: snapshot.team.id,
    type: "news_impact",
    severity: Math.abs(newsEvent.impactScore) >= 70 ? "high" : Math.abs(newsEvent.impactScore) >= 45 ? "medium" : "low",
    title: `${snapshot.team.name} has a news-linked market note`,
    shortDescription: newsEvent.headline,
    explanation: `${newsEvent.summary} This is framed as market context and does not assume the news caused the price move.`,
    confidence,
    dataPoints: [
      dataPoint("Impact", `${newsEvent.impactScore >= 0 ? "+" : ""}${newsEvent.impactScore}`, impactTone),
      dataPoint("24h move", formatSignedPercent(snapshot.market.change24h), getTone(snapshot.market.change24h)),
      dataPoint("Source", newsEvent.source, "neutral"),
    ],
    createdAt,
    score: scoreSignal(Math.abs(newsEvent.impactScore) >= 70 ? "high" : "medium", confidence, Math.abs(newsEvent.impactScore) / 25),
  };
}

function createOverheatedSignal(
  snapshot: TeamMarketSnapshot,
  createdAt: string,
  volumeRatio: number,
): SignalCandidate {
  const confidence = confidenceFromParts(52, snapshot.market.change24h * 11, volumeRatio * 18);

  return {
    id: `signal-${snapshot.team.id}-overheated`,
    teamId: snapshot.team.id,
    type: "overheated",
    severity: snapshot.market.change24h >= 2.8 ? "high" : "medium",
    title: `${snapshot.team.name} may be overheated`,
    shortDescription: `Probability jumped ${formatSignedPercent(snapshot.market.change24h)} with bullish sentiment and elevated attention.`,
    explanation:
      "This flags a fast repricing pattern. It is a prompt to inspect the drivers, not a claim that the move is wrong.",
    confidence,
    dataPoints: [
      dataPoint("24h move", formatSignedPercent(snapshot.market.change24h), "positive"),
      dataPoint("Sentiment", snapshot.market.sentiment, "positive"),
      dataPoint("Volume", formatCompactNumber(snapshot.market.volume), "neutral"),
    ],
    createdAt,
    score: scoreSignal("high", confidence, snapshot.market.change24h),
  };
}

function createQuietAccumulationSignal(
  snapshot: TeamMarketSnapshot,
  createdAt: string,
  volumeRatio: number,
): SignalCandidate {
  const confidence = confidenceFromParts(50, snapshot.market.change7d * 7, volumeRatio * 16);

  return {
    id: `signal-${snapshot.team.id}-quiet-accumulation`,
    teamId: snapshot.team.id,
    type: "quiet_accumulation",
    severity: "medium",
    title: `${snapshot.team.name} shows quiet accumulation`,
    shortDescription: `Probability is rising gradually over 7d without a sharp one-day move.`,
    explanation:
      "Quiet accumulation highlights steady repricing that may be easier to miss than a large headline move.",
    confidence,
    dataPoints: [
      dataPoint("24h move", formatSignedPercent(snapshot.market.change24h), "positive"),
      dataPoint("7d move", formatSignedPercent(snapshot.market.change7d), "positive"),
      dataPoint("Volume", formatCompactNumber(snapshot.market.volume), "neutral"),
    ],
    createdAt,
    score: scoreSignal("medium", confidence, snapshot.market.change7d + volumeRatio),
  };
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

  if (magnitude >= 1.2) {
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

function scoreSignal(severity: SignalSeverity, confidence: number, magnitude: number): number {
  return getSeverityRank(severity) * 100 + confidence + magnitude * 3;
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

function dedupeSignals(signals: SignalCandidate[]): SignalCandidate[] {
  const bestByKey = new Map<string, SignalCandidate>();

  for (const signal of signals) {
    const key = `${signal.teamId}:${signal.type}`;
    const existing = bestByKey.get(key);

    if (!existing || signal.score > existing.score) {
      bestByKey.set(key, signal);
    }
  }

  return [...bestByKey.values()];
}

function getLatestUpdatedAt(snapshots: TeamMarketSnapshot[]): string {
  return snapshots.reduce<string>((latest, snapshot) => {
    if (!latest || snapshot.market.updatedAt > latest) {
      return snapshot.market.updatedAt;
    }

    return latest;
  }, new Date(0).toISOString());
}

function getMaxVolume(snapshots: TeamMarketSnapshot[]): number {
  return Math.max(...snapshots.map((snapshot) => snapshot.market.volume), 1);
}

function getMedianVolume(snapshots: TeamMarketSnapshot[]): number {
  if (snapshots.length === 0) {
    return 1;
  }

  const sorted = snapshots.map((snapshot) => snapshot.market.volume).sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

function confidenceFromParts(base: number, ...parts: number[]): number {
  return Math.min(94, Math.max(45, Math.round(base + parts.reduce((sum, value) => sum + value, 0))));
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

function dataPoint(
  label: string,
  value: string,
  tone: NonNullable<MarketSignal["dataPoints"][number]["tone"]>,
): MarketSignal["dataPoints"][number] {
  return { label, value, tone };
}

function getTone(value: number): NonNullable<MarketSignal["dataPoints"][number]["tone"]> {
  if (value > 0) {
    return "positive";
  }

  if (value < 0) {
    return "negative";
  }

  return "neutral";
}
