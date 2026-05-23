import type { NormalizedBookmakerOdds } from "../../data/odds/types";
import type {
  ApiFootballDataIssue,
  ApiFootballFixtureContext,
  ApiFootballInjuryContext,
  ApiFootballSquadPlayer,
  ApiFootballStandingContext,
  NewsEvent,
  TeamFootballMetadata,
  TeamKeyPlayer,
  TeamMarketSnapshot
} from "../../types/market";
import { formatChange, formatProbability } from "../../components/home/market-formatters";
import { buildFallbackProbabilityHistory } from "./probability-history";

export interface StrengthMetric {
  label: string;
  value: number;
}

export interface KeyPlayerView {
  name: string;
  number?: number;
  position: string;
  club?: string;
  note?: string;
  expectedMinutes: number;
  squadProbability: number;
  formScore: number;
  injuryStatus: string;
  topMarket: string;
}

export interface RecentMatchView {
  id: string;
  date: string;
  opponent: string;
  status: string;
  result: string;
  score: string;
  note: string;
}

type KeyPlayerSource = ApiFootballSquadPlayer & {
  club?: string;
  note?: string;
};

export function getStrengthMetrics(
  snapshot: TeamMarketSnapshot,
  metadata: TeamFootballMetadata | undefined,
  squad: ApiFootballSquadPlayer[],
  injuries: ApiFootballInjuryContext[],
  standings: ApiFootballStandingContext[],
  news: NewsEvent[]
): StrengthMetric[] {
  const rank = metadata?.fifaRank ?? snapshot.team.fifaRank;
  const rankBase = rank ? Math.max(64, 99 - rank * 1.2) : 76;
  const valueBoost = metadata?.squadValue
    ? Math.min(9, metadata.squadValue / 140_000_000)
    : 0;
  const attack = clampScore(rankBase + valueBoost);
  const midfield = clampScore(rankBase - 2 + squad.length * 0.18);
  const defense = clampScore(rankBase - injuries.length * 3);
  const form = clampScore(76 + (standings[0]?.wins ?? 2) * 3);
  const depth = clampScore(68 + Math.min(18, squad.length * 0.7) - injuries.length * 1.4);
  const continuity = clampScore(72 + news.length * 1.5 + (metadata?.worldCupTitles ? 3 : 0));

  return [
    { label: "Attack", value: attack },
    { label: "Midfield", value: midfield },
    { label: "Defense", value: defense },
    { label: "Form", value: form },
    { label: "Depth", value: depth },
    { label: "Continuity", value: continuity }
  ];
}

export function getStrengthScore(metrics: StrengthMetric[]): number {
  return Math.round(
    metrics.reduce((sum, item) => sum + item.value, 0) / metrics.length
  );
}

export function getKeyPlayers(
  metadata: TeamFootballMetadata | undefined,
  squad: ApiFootballSquadPlayer[],
  injuries: ApiFootballInjuryContext[],
  snapshot: TeamMarketSnapshot
): KeyPlayerView[] {
  const injuryNames = new Set(
    injuries.map((injury) => injury.playerName.toLowerCase())
  );
  const sourcePlayers: KeyPlayerSource[] = metadata?.keyPlayers.length
    ? metadata.keyPlayers.slice(0, 6).map((player, index) => mapMetadataPlayer(player, index))
    : squad.length > 0
      ? squad.slice(0, 6)
      : buildFallbackPlayers(snapshot.team.name).slice(0, 6);

  return sourcePlayers.map((player, index) => {
    const injured = injuryNames.has(player.name.toLowerCase());

    return {
      name: player.name,
      number: player.number,
      position: player.position ?? "Player",
      club: player.club,
      note: player.note,
      expectedMinutes: Math.max(54, 88 - index * 5 - (injured ? 22 : 0)),
      squadProbability: Math.max(64, 96 - index * 4 - (injured ? 20 : 0)),
      formScore: Math.max(70, Math.round(84 - index * 2)),
      injuryStatus: injured ? "Risk" : "Fit",
      topMarket: player.note ?? "Curated key player"
    };
  });
}

function mapMetadataPlayer(player: TeamKeyPlayer, index: number): KeyPlayerSource {
  return {
    playerId: index + 1,
    name: player.name,
    position: player.position,
    club: player.club,
    note: player.note
  };
}

export function getLineupPlayers(
  squad: ApiFootballSquadPlayer[]
): ApiFootballSquadPlayer[] {
  if (squad.length === 0) {
    return [];
  }

  const ordered = [
    ...squad.filter((player) =>
      player.position?.toLowerCase().includes("attacker")
    ),
    ...squad.filter((player) =>
      player.position?.toLowerCase().includes("midfielder")
    ),
    ...squad.filter((player) =>
      player.position?.toLowerCase().includes("defender")
    ),
    ...squad.filter((player) =>
      player.position?.toLowerCase().includes("goalkeeper")
    ),
    ...squad
  ];
  const unique = new Map<number, ApiFootballSquadPlayer>();

  for (const player of ordered) {
    unique.set(player.playerId, player);
  }

  return [...unique.values()].slice(0, 11);
}

export function getRecentMatches(
  fixtures: ApiFootballFixtureContext[]
): RecentMatchView[] {
  return fixtures
    .filter((fixture) => fixture.status === "finished" && fixture.result)
    .sort((a, b) => b.kickoffAt.localeCompare(a.kickoffAt))
    .slice(0, 5)
    .map((fixture) => ({
      id: String(fixture.fixtureId),
      date: formatShortDate(fixture.kickoffAt),
      opponent: fixture.opponentName,
      status: fixture.status,
      result: fixture.result ?? "-",
      score:
        fixture.goalsFor !== undefined && fixture.goalsAgainst !== undefined
          ? `${fixture.goalsFor}-${fixture.goalsAgainst}`
          : "Pending",
      note: fixture.leagueName ?? "Fixture result stored from API-Football."
    }));
}

export function getNextFixture(
  fixtures: ApiFootballFixtureContext[]
): ApiFootballFixtureContext | undefined {
  return [...fixtures]
    .filter((fixture) => fixture.status === "scheduled")
    .sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt))[0];
}

export function getGroupPeerMetadata(
  metadata: TeamFootballMetadata | undefined,
  allMetadata: TeamFootballMetadata[]
): TeamFootballMetadata[] {
  if (!metadata) {
    return [];
  }

  const peerIds = new Set(metadata.groupPeers);
  return allMetadata.filter((item) => peerIds.has(item.teamId));
}

export function getIssueMessage(
  issues: ApiFootballDataIssue[],
  dimension: ApiFootballDataIssue["dimension"]
): string | undefined {
  return issues.find((issue) => issue.dimension === dimension)?.message;
}

export function formatSquadValue(metadata: TeamFootballMetadata | undefined): string {
  if (!metadata?.squadValue) {
    return "Pending";
  }

  const currency = metadata.squadValueCurrency === "USD" ? "$" : "€";

  if (metadata.squadValue >= 1_000_000_000) {
    return `${currency}${(metadata.squadValue / 1_000_000_000).toFixed(2)}B`;
  }

  return `${currency}${Math.round(metadata.squadValue / 1_000_000)}M`;
}

export function formatFixtureDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function formatShortDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric"
  }).format(date);
}

export function formatImpact(value: number): string {
  return value >= 0 ? `+${value}` : String(value);
}

export function getMovementNarrative(
  snapshot: TeamMarketSnapshot,
  relatedNewsCount: number
): string {
  const direction = snapshot.market.change24h >= 0 ? "rose" : "fell";
  const newsCopy =
    relatedNewsCount > 0
      ? `${relatedNewsCount} related news item${relatedNewsCount === 1 ? "" : "s"} are attached.`
      : "No qualifying news item is attached yet.";

  return `${snapshot.team.name} probability ${direction} ${formatChange(Math.abs(snapshot.market.change24h))} in the latest window. ${newsCopy} This is correlation context, not causation.`;
}

export function resolveChartHistory(
  snapshot: TeamMarketSnapshot,
  history: import("../../types/market").ProbabilityHistoryPoint[]
) {
  return history.length > 0 ? history : buildFallbackProbabilityHistory(snapshot);
}

export function sortNewsByPublished(news: NewsEvent[]): NewsEvent[] {
  return [...news].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

function buildFallbackPlayers(teamName: string): ApiFootballSquadPlayer[] {
  return ["Captain", "Forward", "Midfielder", "Defender", "Goalkeeper"].map(
    (role, index) => ({
      playerId: index + 1,
      name: `${teamName} ${role}`,
      number: index + 1,
      position: role
    })
  );
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function shortenName(name: string): string {
  const parts = name.split(" ");

  if (parts.length <= 2) {
    return name;
  }

  return `${parts[0][0]}. ${parts.at(-1)}`;
}

function clampScore(value: number): number {
  return Math.round(Math.max(45, Math.min(98, value)));
}

export { formatProbability, formatChange };
