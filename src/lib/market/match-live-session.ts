import type { MatchLiveSnapshot } from "@/lib/market/sports-ws-live-state";

export const MATCH_LIVE_SESSION_STORAGE_KEY = "prophet:match-live-store";

export interface PersistedMatchLiveState {
  bySlug: Record<string, MatchLiveSnapshot>;
  eventIdToSlug: Record<string, string>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isMatchLiveSnapshot(value: unknown): value is MatchLiveSnapshot {
  if (!isRecord(value) || typeof value.status !== "string") {
    return false;
  }

  return true;
}

function parsePersistedState(raw: unknown): PersistedMatchLiveState | null {
  if (!isRecord(raw) || !isRecord(raw.bySlug) || !isRecord(raw.eventIdToSlug)) {
    return null;
  }

  const bySlug: Record<string, MatchLiveSnapshot> = {};

  for (const [key, snapshot] of Object.entries(raw.bySlug)) {
    if (isMatchLiveSnapshot(snapshot)) {
      bySlug[key] = snapshot;
    }
  }

  const eventIdToSlug: Record<string, string> = {};

  for (const [eventId, slug] of Object.entries(raw.eventIdToSlug)) {
    if (typeof slug === "string" && slug.trim()) {
      eventIdToSlug[eventId] = slug;
    }
  }

  return { bySlug, eventIdToSlug };
}

export function loadMatchLiveSession(): PersistedMatchLiveState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(MATCH_LIVE_SESSION_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    return parsePersistedState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveMatchLiveSession(state: PersistedMatchLiveState): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      MATCH_LIVE_SESSION_STORAGE_KEY,
      JSON.stringify(state),
    );
  } catch {
    // Ignore quota or privacy-mode write failures.
  }
}
