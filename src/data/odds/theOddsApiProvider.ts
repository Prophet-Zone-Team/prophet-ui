import { worldCupTeams } from "../teams/worldCupTeams";
import { getTeamNameAliases, normalizeTeamAlias } from "../../config/team-name-aliases";
import type { Team } from "../../types/market";
import type {
  NormalizedBookmakerOdds,
  NormalizedTeamOddsSummary,
  OddsProvider,
  WorldCupWinnerOdds,
} from "./types";

const THE_ODDS_API_BASE_URL = "https://api.the-odds-api.com/v4";
const DEFAULT_MARKET_KEYS = ["soccer_fifa_world_cup_winner", "soccer_fifa_world_cup"];
const REQUEST_TIMEOUT_MS = 8_000;

interface TheOddsApiSport {
  key?: string;
  group?: string;
  title?: string;
  description?: string;
  active?: boolean;
  has_outrights?: boolean;
}

interface TheOddsApiOutcome {
  name?: string;
  price?: number;
}

interface TheOddsApiMarket {
  key?: string;
  last_update?: string;
  outcomes?: TheOddsApiOutcome[];
}

interface TheOddsApiBookmaker {
  key?: string;
  title?: string;
  last_update?: string;
  markets?: TheOddsApiMarket[];
}

interface TheOddsApiEvent {
  id?: string;
  sport_key?: string;
  sport_title?: string;
  commence_time?: string;
  bookmakers?: TheOddsApiBookmaker[];
}

interface TheOddsApiErrorPayload {
  message?: string;
  error_code?: string;
}

export const theOddsApiProvider: OddsProvider = {
  async getWorldCupWinnerOdds(): Promise<WorldCupWinnerOdds> {
    return getTheOddsApiWorldCupWinnerOdds();
  },
};

export async function getTheOddsApiWorldCupWinnerOdds(): Promise<WorldCupWinnerOdds> {
  const apiKey = process.env.THE_ODDS_API_KEY;

  if (!apiKey) {
    return emptyOdds("missing_api_key", "THE_ODDS_API_KEY is not configured.");
  }

  try {
    const marketKey = await resolveWorldCupOutrightSportKey(apiKey);
    const events = await fetchWorldCupOutrightOdds(apiKey, marketKey);
    const odds = mapOddsEvents(events, worldCupTeams);
    const summaries = summarizeBookmakerOdds(odds);
    const lastUpdated = getLatestUpdatedAt(odds);

    return {
      odds,
      summaries,
      meta: {
        source: "the-odds-api",
        status: summaries.length > 0 ? "live" : "empty",
        marketKey,
        bookmakerCount: new Set(odds.map((item) => item.bookmaker)).size,
        teamCount: summaries.length,
        lastUpdated,
        error: summaries.length > 0 ? undefined : "The Odds API returned no matching World Cup winner prices.",
      },
    };
  } catch (error) {
    return emptyOdds("unavailable", getErrorMessage(error));
  }
}

async function resolveWorldCupOutrightSportKey(apiKey: string): Promise<string> {
  const configuredKey = process.env.THE_ODDS_API_WORLD_CUP_SPORT_KEY;

  if (configuredKey) {
    return configuredKey;
  }

  const sports = await fetchSports(apiKey);
  const candidate = sports.find(isWorldCupOutrightSport);

  return candidate?.key ?? DEFAULT_MARKET_KEYS[0];
}

async function fetchSports(apiKey: string): Promise<TheOddsApiSport[]> {
  const url = new URL(`${THE_ODDS_API_BASE_URL}/sports`);
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("all", "true");

  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    throw new Error(`The Odds API sports endpoint returned HTTP ${response.status}: ${await readApiError(response)}`);
  }

  const payload = (await response.json()) as unknown;
  return Array.isArray(payload) ? payload.filter(isSport) : [];
}

async function fetchWorldCupOutrightOdds(apiKey: string, sportKey: string): Promise<TheOddsApiEvent[]> {
  const url = new URL(`${THE_ODDS_API_BASE_URL}/sports/${sportKey}/odds`);
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("regions", process.env.THE_ODDS_API_REGIONS ?? "us,uk,eu");
  url.searchParams.set("markets", "outrights");
  url.searchParams.set("oddsFormat", "decimal");

  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    throw new Error(`The Odds API odds endpoint returned HTTP ${response.status}: ${await readApiError(response)}`);
  }

  const payload = (await response.json()) as unknown;
  return Array.isArray(payload) ? payload.filter(isEvent) : [];
}

async function fetchWithTimeout(url: URL): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  return fetch(url, {
    cache: "no-store",
    signal: controller.signal,
    headers: {
      accept: "application/json",
    },
  }).finally(() => clearTimeout(timeout));
}

function mapOddsEvents(events: TheOddsApiEvent[], teams: Team[]): NormalizedBookmakerOdds[] {
  const odds: NormalizedBookmakerOdds[] = [];

  for (const event of events) {
    for (const bookmaker of event.bookmakers ?? []) {
      for (const market of bookmaker.markets ?? []) {
        if (market.key !== "outrights") {
          continue;
        }

        for (const outcome of market.outcomes ?? []) {
          const team = findTeamByOutcomeName(outcome.name, teams);
          const decimalOdds = outcome.price;

          if (!team || !decimalOdds || decimalOdds <= 1) {
            continue;
          }

          odds.push({
            bookmaker: bookmaker.title ?? bookmaker.key ?? "Bookmaker",
            teamId: team.id,
            decimalOdds,
            impliedProbability: roundProbability((1 / decimalOdds) * 100),
            lastUpdated: market.last_update ?? bookmaker.last_update,
            marketKey: event.sport_key,
          });
        }
      }
    }
  }

  return odds;
}

function summarizeBookmakerOdds(odds: NormalizedBookmakerOdds[]): NormalizedTeamOddsSummary[] {
  const byTeam = new Map<string, NormalizedBookmakerOdds[]>();

  for (const item of odds) {
    const existing = byTeam.get(item.teamId) ?? [];
    byTeam.set(item.teamId, [...existing, item]);
  }

  return [...byTeam.entries()].map(([teamId, items]) => {
    const probabilities = items.map((item) => item.impliedProbability).sort((a, b) => a - b);

    return {
      teamId,
      bookmakerCount: new Set(items.map((item) => item.bookmaker)).size,
      averageImpliedProbability: roundProbability(average(probabilities)),
      medianImpliedProbability: roundProbability(median(probabilities)),
      minImpliedProbability: probabilities[0],
      maxImpliedProbability: probabilities[probabilities.length - 1],
      lastUpdated: getLatestUpdatedAt(items),
    };
  });
}

function findTeamByOutcomeName(name: string | undefined, teams: Team[]): Team | undefined {
  if (!name) {
    return undefined;
  }

  const normalizedName = normalizeTeamAlias(name);

  return teams.find((team) => getTeamNameAliases(team).some((alias) => alias === normalizedName));
}

function isWorldCupOutrightSport(sport: TheOddsApiSport): boolean {
  const text = normalizeTeamAlias(`${sport.key ?? ""} ${sport.title ?? ""} ${sport.description ?? ""}`);
  return (
    sport.active !== false &&
    sport.has_outrights === true &&
    text.includes("world cup") &&
    (text.includes("winner") || text.includes("outright"))
  );
}

function isSport(value: unknown): value is TheOddsApiSport {
  return typeof value === "object" && value !== null;
}

function isEvent(value: unknown): value is TheOddsApiEvent {
  return typeof value === "object" && value !== null;
}

function emptyOdds(status: "missing_api_key" | "unavailable" | "empty", error: string): WorldCupWinnerOdds {
  return {
    odds: [],
    summaries: [],
    meta: {
      source: status === "missing_api_key" ? "none" : "the-odds-api",
      status,
      bookmakerCount: 0,
      teamCount: 0,
      error,
    },
  };
}

async function readApiError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as TheOddsApiErrorPayload;
    return payload.message ?? payload.error_code ?? response.statusText;
  } catch {
    return response.statusText;
  }
}

function getLatestUpdatedAt(items: Array<{ lastUpdated?: string }>): string | undefined {
  return items.reduce<string | undefined>((latest, item) => {
    if (!item.lastUpdated) {
      return latest;
    }

    return !latest || item.lastUpdated > latest ? item.lastUpdated : latest;
  }, undefined);
}

function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const midpoint = Math.floor(values.length / 2);

  if (values.length % 2 === 1) {
    return values[midpoint];
  }

  return average([values[midpoint - 1], values[midpoint]]);
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function roundProbability(value: number): number {
  return Math.round(value * 10) / 10;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.name === "AbortError" ? "The Odds API request timed out." : error.message;
  }

  return "The Odds API is unavailable.";
}
