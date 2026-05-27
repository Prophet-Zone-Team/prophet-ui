import {
  GAMMA_API_BASE,
  isGammaEventRecord,
  isGammaSportsRecord,
  parseGammaArrayField,
  type GammaEventRecord,
  type GammaSportsRecord,
} from "@/lib/market/polymarket-gamma";
import {
  isWorldCupFixtureEvent,
  mapGammaEventToMatch,
  mapGammaEventsToMatches,
  resolveWorldCupTagIds,
} from "@/lib/market/polymarket-football-match-mapper";
import { enrichFootballMatchesWithClobData } from "@/server/market/fixture-clob-enrichment";
import { serverFetch } from "@/server/trading/server-fetch";
import type { FreshnessMeta, WorldCupMatch } from "@/types/market";

const EVENTS_CACHE_TTL_MS = 60_000;
const EVENTS_PAGE_LIMIT = 100;
const WORLD_CUP_EVENT_LIMIT = 100;

interface CachedFootballEvents {
  events: GammaEventRecord[];
  matches: WorldCupMatch[];
  meta: FreshnessMeta;
  expiresAt: number;
}

let cachedFootballEvents: CachedFootballEvents | undefined;

export interface PolymarketFootballEventsResult {
  matches: WorldCupMatch[];
  events: GammaEventRecord[];
  meta: FreshnessMeta;
}

export async function fetchPolymarketFootballEvents(): Promise<PolymarketFootballEventsResult> {
  if (cachedFootballEvents && cachedFootballEvents.expiresAt > Date.now()) {
    return {
      matches: cachedFootballEvents.matches,
      events: cachedFootballEvents.events,
      meta: cachedFootballEvents.meta,
    };
  }

  try {
    const sports = await fetchSportsMetadata();
    const tagIds = resolveWorldCupTagIds(sports);
    let events = await fetchFixtureEventsForTags(tagIds, WORLD_CUP_EVENT_LIMIT);

    if (events.length === 0) {
      events = await fetchWorldCupFixturesViaSearch(WORLD_CUP_EVENT_LIMIT);
    }

    const mappedMatches = mapGammaEventsToMatches(events);
    const matches = await enrichFootballMatchesWithClobData(mappedMatches);
    const lastUpdated = new Date().toISOString();
    const meta: FreshnessMeta = {
      source: "polymarket-gamma+clob",
      status: events.length > 0 ? "live" : "unavailable",
      lastUpdated,
    };

    cachedFootballEvents = {
      events,
      matches,
      meta,
      expiresAt: Date.now() + EVENTS_CACHE_TTL_MS,
    };

    return {
      matches,
      events,
      meta,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load Polymarket football events.";
    const meta: FreshnessMeta = {
      source: "polymarket-gamma",
      status: "unavailable",
      lastUpdated: new Date().toISOString(),
    };

    return {
      matches: [],
      events: [],
      meta: {
        ...meta,
        source: `${meta.source}: ${message}`,
      },
    };
  }
}

async function fetchSportsMetadata(): Promise<GammaSportsRecord[]> {
  const response = await serverFetch(`${GAMMA_API_BASE}/sports`, {
    cache: "no-store",
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Polymarket /sports returned HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as unknown;

  if (!Array.isArray(payload)) {
    throw new Error("Polymarket /sports returned an unexpected payload.");
  }

  return payload.filter(isGammaSportsRecord);
}

async function fetchFixtureEventsForTags(
  tagIds: string[],
  limit: number,
): Promise<GammaEventRecord[]> {
  const eventsById = new Map<string, GammaEventRecord>();

  for (const tagId of tagIds) {
    let offset = 0;

    while (eventsById.size < limit) {
      const page = await fetchEventsPage(EVENTS_PAGE_LIMIT, tagId, offset);

      if (page.length === 0) {
        break;
      }

      for (const event of page) {
        if (!isWorldCupFixtureEvent(event) || !hasBidFixtureMoneyline(event)) {
          continue;
        }

        const key = String(event.id ?? event.slug);

        if (key) {
          eventsById.set(key, event);
        }
      }

      if (page.length < EVENTS_PAGE_LIMIT) {
        break;
      }

      offset += EVENTS_PAGE_LIMIT;
    }
  }

  return sortEventsByKickoff([...eventsById.values()]).slice(0, limit);
}

async function fetchWorldCupFixturesViaSearch(limit: number): Promise<GammaEventRecord[]> {
  const queries = ["fifwc", "FIFA World Cup"];
  const eventsById = new Map<string, GammaEventRecord>();

  for (const query of queries) {
    const url = new URL(`${GAMMA_API_BASE}/public-search`);
    url.searchParams.set("q", query);

    const response = await serverFetch(url, {
      cache: "no-store",
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      continue;
    }

    const payload = (await response.json()) as { events?: unknown[] };
    const events = Array.isArray(payload.events)
      ? payload.events.filter(isGammaEventRecord)
      : [];

    for (const event of events) {
      if (event.closed === true || event.active === false) {
        continue;
      }

      if (!isWorldCupFixtureEvent(event) || !hasBidFixtureMoneyline(event)) {
        continue;
      }

      const key = String(event.id ?? event.slug);

      if (key) {
        eventsById.set(key, event);
      }
    }

    if (eventsById.size >= limit) {
      break;
    }
  }

  return sortEventsByKickoff([...eventsById.values()]).slice(0, limit);
}

async function fetchEventsPage(
  limit: number,
  tagId?: string,
  offset = 0,
): Promise<GammaEventRecord[]> {
  const url = new URL(`${GAMMA_API_BASE}/events`);
  url.searchParams.set("active", "true");
  url.searchParams.set("closed", "false");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("order", "start_date");
  url.searchParams.set("ascending", "true");

  if (tagId) {
    url.searchParams.set("tag_id", tagId);
  }

  const response = await serverFetch(url, {
    cache: "no-store",
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Polymarket /events returned HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as unknown;

  if (!Array.isArray(payload)) {
    throw new Error("Polymarket /events returned an unexpected payload.");
  }

  return payload.filter(isGammaEventRecord);
}

function hasBidFixtureMoneyline(event: GammaEventRecord): boolean {
  const moneylineMarkets = (event.markets ?? []).filter((market) => {
    if (market.acceptingOrders !== true) {
      return false;
    }

    const marketType = String(market.sportsMarketType ?? "").toLowerCase();
    return marketType === "moneyline" || marketType === "ml";
  });

  return moneylineMarkets.length >= 3;
}

function sortEventsByKickoff(events: GammaEventRecord[]): GammaEventRecord[] {
  return events.sort((left, right) => getEventKickoffTime(left) - getEventKickoffTime(right));
}

function getEventKickoffTime(event: GammaEventRecord): number {
  const kickoff = event.startTime ?? event.startDate;

  if (!kickoff) {
    return Number.POSITIVE_INFINITY;
  }

  const time = Date.parse(kickoff);
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}

export async function fetchGammaEventBySlug(
  slug: string,
): Promise<GammaEventRecord | undefined> {
  const response = await serverFetch(
    `${GAMMA_API_BASE}/events/slug/${encodeURIComponent(slug)}`,
    {
      cache: "no-store",
      headers: {
        accept: "application/json",
      },
    },
  );

  if (response.status === 404 || !response.ok) {
    return undefined;
  }

  const payload = (await response.json()) as unknown;

  return isGammaEventRecord(payload) ? payload : undefined;
}

export async function fetchPolymarketFootballMatchBySlug(
  slug: string,
): Promise<WorldCupMatch | undefined> {
  const event = await fetchGammaEventBySlug(slug);
  const match = event ? mapGammaEventToMatch(event) : undefined;

  if (!match) {
    return undefined;
  }

  const [enrichedMatch] = await enrichFootballMatchesWithClobData([match]);
  return enrichedMatch;
}

export function clearPolymarketFootballEventsCache(): void {
  cachedFootballEvents = undefined;
}
