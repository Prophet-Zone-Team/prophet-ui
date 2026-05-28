import { parseMatchScoreString } from "@/lib/market/parse-match-score";
import type { PolymarketSportsWsUpdate } from "@/types/polymarket-sports-ws";
import type { WorldCupMatch, WorldCupMatchStatus } from "@/types/market";

export interface MatchLiveSnapshot {
  homeScore?: number;
  awayScore?: number;
  status: WorldCupMatchStatus;
  liveElapsedSeconds?: number;
}

export type MatchLiveSnapshotPatch = Partial<MatchLiveSnapshot>;

function normalizeSportsText(value: string): string {
  return value.trim().toLowerCase();
}

export function resolveMatchSlug(match: WorldCupMatch): string {
  return match.id || match.polymarket?.slug || "";
}

export function worldCupMatchToLiveSnapshot(
  match: WorldCupMatch
): MatchLiveSnapshot {
  return {
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    status: match.status,
    liveElapsedSeconds: match.liveElapsedSeconds,
  };
}

export function parseSportsElapsedSeconds(
  elapsed: string | undefined
): number | undefined {
  if (!elapsed) {
    return undefined;
  }

  const parts = elapsed.trim().split(":");

  if (parts.length !== 2) {
    return undefined;
  }

  const minutes = Number(parts[0]);
  const seconds = Number(parts[1]);

  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) {
    return undefined;
  }

  return minutes * 60 + seconds;
}

export function mapSportsWsUpdateStatus(
  update: PolymarketSportsWsUpdate
): WorldCupMatchStatus | undefined {
  if (update.ended === true) {
    return "finished";
  }

  if (update.live === true) {
    return "live";
  }

  const period = normalizeSportsText(update.period ?? "");

  if (period) {
    if (
      period === "ft" ||
      period.includes("final") ||
      period === "pen" ||
      period === "aet"
    ) {
      return "finished";
    }

    if (
      period === "1h" ||
      period === "2h" ||
      period === "ht" ||
      period.startsWith("q") ||
      period === "ot" ||
      period.startsWith("p")
    ) {
      return "live";
    }
  }

  if (update.live === false && update.ended === false) {
    return "scheduled";
  }

  return undefined;
}

export function polymarketSportsWsUpdateToLivePatch(
  update: PolymarketSportsWsUpdate,
  current?: MatchLiveSnapshot
): MatchLiveSnapshotPatch {
  const patch: MatchLiveSnapshotPatch = {};
  const parsedScore = parseMatchScoreString(update.score);

  if (parsedScore.homeScore !== undefined) {
    patch.homeScore = parsedScore.homeScore;
  }

  if (parsedScore.awayScore !== undefined) {
    patch.awayScore = parsedScore.awayScore;
  }

  const status = mapSportsWsUpdateStatus(update);

  if (status !== undefined) {
    patch.status = status;
  } else if (current?.status !== undefined) {
    patch.status = current.status;
  }

  const elapsedSeconds = parseSportsElapsedSeconds(update.elapsed);

  if (elapsedSeconds !== undefined) {
    patch.liveElapsedSeconds = elapsedSeconds;
  }

  return patch;
}

export function mergeLiveSnapshot(
  current: MatchLiveSnapshot | undefined,
  patch: MatchLiveSnapshotPatch
): MatchLiveSnapshot | undefined {
  if (!current && patch.status === undefined) {
    return undefined;
  }

  return {
    homeScore: patch.homeScore ?? current?.homeScore,
    awayScore: patch.awayScore ?? current?.awayScore,
    status: patch.status ?? current?.status ?? "unknown",
    liveElapsedSeconds:
      patch.liveElapsedSeconds ?? current?.liveElapsedSeconds,
  };
}

export function mergeMatchWithLiveSnapshot(
  match: WorldCupMatch,
  snapshot: MatchLiveSnapshot | undefined
): WorldCupMatch {
  if (!snapshot) {
    return match;
  }

  return {
    ...match,
    homeScore: snapshot.homeScore ?? match.homeScore,
    awayScore: snapshot.awayScore ?? match.awayScore,
    status: snapshot.status,
    liveElapsedSeconds:
      snapshot.liveElapsedSeconds ?? match.liveElapsedSeconds,
  };
}
