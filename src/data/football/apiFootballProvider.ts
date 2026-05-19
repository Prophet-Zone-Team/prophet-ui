import { apiFootballTeamConfig, getApiFootballTeamConfig } from "../../config/api-football-team-config";
import type {
  ApiFootballDataIssue,
  ApiFootballFixtureContext,
  ApiFootballInjuryContext,
  ApiFootballOddContext,
  ApiFootballSquadPlayer,
  ApiFootballStandingContext,
  ApiFootballTeamContext,
  ApiFootballTeamProfile,
  FootballContextMeta,
  Team,
  TeamMarketSnapshot,
} from "../../types/market";

const API_FOOTBALL_BASE_URL = "https://v3.football.api-sports.io";
const REQUEST_TIMEOUT_MS = 5000;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const profileCache = new Map<string, { expiresAt: number; profile: ApiFootballTeamProfile | undefined }>();

interface ApiFootballProviderResult {
  context: ApiFootballTeamContext[];
  meta: FootballContextMeta;
}

interface ApiFootballTeamsResponse {
  response?: ApiFootballTeamResponse[];
  errors?: unknown;
}

interface ApiFootballFixturesResponse {
  response?: ApiFootballFixtureResponse[];
  errors?: unknown;
}

interface ApiFootballSquadResponse {
  response?: ApiFootballSquadTeamResponse[];
  errors?: unknown;
}

interface ApiFootballInjuriesResponse {
  response?: ApiFootballInjuryResponse[];
  errors?: unknown;
}

interface ApiFootballStandingsResponse {
  response?: ApiFootballStandingLeagueResponse[];
  errors?: unknown;
}

interface ApiFootballOddsResponse {
  response?: ApiFootballOddFixtureResponse[];
  errors?: unknown;
}

interface ApiFootballTeamResponse {
  team?: {
    id?: number;
    name?: string;
    code?: string;
    country?: string;
    founded?: number;
    national?: boolean;
    logo?: string;
  };
  venue?: {
    name?: string;
    city?: string;
    capacity?: number;
    surface?: string;
    image?: string;
  };
}

interface ApiFootballFixtureResponse {
  fixture?: {
    id?: number;
    date?: string;
    status?: {
      short?: string;
      long?: string;
    };
    venue?: {
      name?: string;
      city?: string;
    };
  };
  league?: {
    name?: string;
    round?: string;
  };
  goals?: {
    home?: number | null;
    away?: number | null;
  };
  teams?: {
    home?: ApiFootballFixtureTeam;
    away?: ApiFootballFixtureTeam;
  };
}

interface ApiFootballFixtureTeam {
  id?: number;
  name?: string;
  logo?: string;
}

interface ApiFootballSquadTeamResponse {
  players?: ApiFootballSquadPlayerResponse[];
}

interface ApiFootballSquadPlayerResponse {
  id?: number;
  name?: string;
  age?: number;
  number?: number;
  position?: string;
  photo?: string;
}

interface ApiFootballInjuryResponse {
  player?: {
    id?: number;
    name?: string;
    photo?: string;
    type?: string;
    reason?: string;
  };
  fixture?: {
    id?: number;
    date?: string;
  };
  league?: {
    name?: string;
  };
}

interface ApiFootballStandingLeagueResponse {
  league?: {
    id?: number;
    name?: string;
    season?: number;
    standings?: ApiFootballStandingResponse[][];
  };
}

interface ApiFootballStandingResponse {
  rank?: number;
  group?: string;
  points?: number;
  goalsDiff?: number;
  form?: string;
  status?: string;
  description?: string;
  all?: {
    played?: number;
    win?: number;
    draw?: number;
    lose?: number;
    goals?: {
      for?: number;
      against?: number;
    };
  };
}

interface ApiFootballOddFixtureResponse {
  fixture?: {
    id?: number;
  };
  bookmakers?: Array<{
    name?: string;
    bets?: Array<{
      name?: string;
      values?: Array<{
        value?: string;
        odd?: string;
      }>;
    }>;
  }>;
}

export async function getApiFootballContext(
  snapshots: TeamMarketSnapshot[],
): Promise<ApiFootballProviderResult> {
  const apiKey = process.env.API_FOOTBALL_KEY;

  if (!apiKey) {
    return {
      context: [],
      meta: {
        source: "api-football",
        status: "missing_api_key",
        teamCount: 0,
        error: "API_FOOTBALL_KEY is not configured.",
      },
    };
  }

  try {
    const context = (
      await Promise.all(snapshots.map((snapshot) => getTeamContext(snapshot.team, apiKey)))
    ).filter(isApiFootballTeamContext);
    const lastUpdated = context.reduce<string | undefined>((latest, teamContext) => {
      if (!latest || teamContext.profile.updatedAt > latest) {
        return teamContext.profile.updatedAt;
      }

      return latest;
    }, undefined);

    return {
      context,
      meta: {
        source: "api-football",
        status: "live",
        teamCount: context.length,
        lastUpdated,
      },
    };
  } catch (error) {
    return {
      context: [],
      meta: {
        source: "api-football",
        status: "unavailable",
        teamCount: 0,
        error: getErrorMessage(error),
      },
    };
  }
}

export async function getApiFootballTeamContext(
  team: Team,
  apiKey = process.env.API_FOOTBALL_KEY,
): Promise<ApiFootballTeamContext | undefined> {
  if (!apiKey) {
    return undefined;
  }

  return getTeamContext(team, apiKey);
}

async function getTeamContext(team: Team, apiKey: string): Promise<ApiFootballTeamContext | undefined> {
  const profile = await getTeamProfile(team, apiKey);

  if (!profile) {
    return undefined;
  }

  const fixturesResult = await collectDimension("fixtures", () => getTeamFixtures(profile, apiKey));
  const squadResult = await collectDimension("squad", () => getTeamSquad(profile, apiKey));
  const injuriesResult = await collectDimension("injuries", () => getTeamInjuries(profile, apiKey));
  const standingsResult = await collectDimension("standings", () => getTeamStandings(profile, apiKey));
  const oddsResult = await collectDimension("odds", () => getTeamOdds(fixturesResult.data, apiKey));

  return {
    profile,
    fixtures: fixturesResult.data,
    squad: squadResult.data,
    injuries: injuriesResult.data,
    standings: standingsResult.data,
    odds: oddsResult.data,
    dataIssues: [
      ...fixturesResult.issues,
      ...squadResult.issues,
      ...injuriesResult.issues,
      ...standingsResult.issues,
      ...oddsResult.issues,
    ],
  };
}

async function getTeamProfile(team: Team, apiKey: string): Promise<ApiFootballTeamProfile | undefined> {
  const cacheKey = team.id;
  const cached = profileCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.profile;
  }

  const config = getApiFootballTeamConfig(team.id);
  const search = config?.search ?? team.name;
  const payload = await fetchApiFootballTeams(search, apiKey);
  const match = findBestTeamMatch(payload.response ?? [], team, config?.apiFootballTeamId);
  const profile = match ? mapTeamProfile(match, team.id) : undefined;

  if (profile) {
    profileCache.set(cacheKey, {
      profile,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
  }

  return profile;
}

async function getTeamFixtures(profile: ApiFootballTeamProfile, apiKey: string): Promise<ApiFootballFixtureContext[]> {
  const payload = await fetchApiFootballFixtures(profile.apiFootballTeamId, apiKey);

  return (payload.response ?? [])
    .map((fixture) => mapFixtureContext(fixture, profile))
    .filter(isApiFootballFixtureContext);
}

async function getTeamSquad(profile: ApiFootballTeamProfile, apiKey: string): Promise<ApiFootballSquadPlayer[]> {
  const payload = await fetchApiFootballSquad(profile.apiFootballTeamId, apiKey);
  return (payload.response?.[0]?.players ?? []).map(mapSquadPlayer).filter(isApiFootballSquadPlayer);
}

async function getTeamInjuries(profile: ApiFootballTeamProfile, apiKey: string): Promise<ApiFootballInjuryContext[]> {
  const payload = await fetchApiFootballInjuries(profile.apiFootballTeamId, apiKey);
  return (payload.response ?? []).map(mapInjuryContext).filter(isApiFootballInjuryContext);
}

async function getTeamStandings(profile: ApiFootballTeamProfile, apiKey: string): Promise<ApiFootballStandingContext[]> {
  const payload = await fetchApiFootballStandings(profile.apiFootballTeamId, apiKey);

  return (payload.response ?? []).flatMap(mapStandingContexts);
}

async function getTeamOdds(fixtures: ApiFootballFixtureContext[], apiKey: string): Promise<ApiFootballOddContext[]> {
  const odds: ApiFootballOddContext[] = [];

  if (fixtures.length === 0) {
    throw new Error("Odds require upcoming fixtures; API-Football returned no fixture context for this team.");
  }

  for (const fixture of fixtures.slice(0, 2)) {
    const payload = await fetchApiFootballOdds(fixture.fixtureId, apiKey);
    odds.push(...(payload.response ?? []).flatMap(mapOddContexts));
  }

  return odds.slice(0, 12);
}

async function fetchApiFootballTeams(search: string, apiKey: string): Promise<ApiFootballTeamsResponse> {
  const url = new URL(`${API_FOOTBALL_BASE_URL}/teams`);
  url.searchParams.set("search", search);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const response = await fetch(url, {
    cache: "no-store",
    signal: controller.signal,
    headers: {
      accept: "application/json",
      "x-apisports-key": apiKey,
    },
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    throw new Error(`API-Football returned HTTP ${response.status}.`);
  }

  const data = (await response.json()) as ApiFootballTeamsResponse;
  const errorMessage = getApiFootballPayloadError(data.errors);

  if (errorMessage) {
    throw new Error(errorMessage);
  }

  return data;
}

async function fetchApiFootballFixtures(teamId: number, apiKey: string): Promise<ApiFootballFixturesResponse> {
  const [lastPayload, nextPayload] = await Promise.all([
    fetchApiFootballFixturesWindow(teamId, apiKey, "last"),
    fetchApiFootballFixturesWindow(teamId, apiKey, "next"),
  ]);

  return {
    response: dedupeFixtures([
      ...(lastPayload.response ?? []),
      ...(nextPayload.response ?? []),
    ]),
    errors: lastPayload.errors ?? nextPayload.errors,
  };
}

async function fetchApiFootballFixturesWindow(
  teamId: number,
  apiKey: string,
  window: "last" | "next",
): Promise<ApiFootballFixturesResponse> {
  const url = new URL(`${API_FOOTBALL_BASE_URL}/fixtures`);
  url.searchParams.set("team", String(teamId));
  url.searchParams.set(window, "5");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const response = await fetch(url, {
    cache: "no-store",
    signal: controller.signal,
    headers: {
      accept: "application/json",
      "x-apisports-key": apiKey,
    },
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    throw new Error(`API-Football fixtures ${window} returned HTTP ${response.status}.`);
  }

  const data = (await response.json()) as ApiFootballFixturesResponse;
  const errorMessage = getApiFootballPayloadError(data.errors);

  if (errorMessage) {
    throw new Error(errorMessage);
  }

  return data;
}

function dedupeFixtures(fixtures: ApiFootballFixtureResponse[]): ApiFootballFixtureResponse[] {
  const byId = new Map<number, ApiFootballFixtureResponse>();

  for (const fixture of fixtures) {
    const fixtureId = fixture.fixture?.id;

    if (!fixtureId) {
      continue;
    }

    byId.set(fixtureId, fixture);
  }

  return [...byId.values()].sort((a, b) => (a.fixture?.date ?? "").localeCompare(b.fixture?.date ?? ""));
}

async function fetchApiFootballSquad(teamId: number, apiKey: string): Promise<ApiFootballSquadResponse> {
  return fetchApiFootball("players/squads", { team: String(teamId) }, apiKey);
}

async function fetchApiFootballInjuries(teamId: number, apiKey: string): Promise<ApiFootballInjuriesResponse> {
  return fetchApiFootball("injuries", { team: String(teamId), season: "2026" }, apiKey);
}

async function fetchApiFootballStandings(teamId: number, apiKey: string): Promise<ApiFootballStandingsResponse> {
  return fetchApiFootball("standings", { team: String(teamId), season: "2026" }, apiKey);
}

async function fetchApiFootballOdds(fixtureId: number, apiKey: string): Promise<ApiFootballOddsResponse> {
  return fetchApiFootball("odds", { fixture: String(fixtureId) }, apiKey);
}

async function fetchApiFootball<T>(path: string, params: Record<string, string>, apiKey: string): Promise<T> {
  const url = new URL(`${API_FOOTBALL_BASE_URL}/${path}`);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const response = await fetch(url, {
    cache: "no-store",
    signal: controller.signal,
    headers: {
      accept: "application/json",
      "x-apisports-key": apiKey,
    },
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    throw new Error(`API-Football ${path} returned HTTP ${response.status}.`);
  }

  const data = (await response.json()) as T & { errors?: unknown };
  const errorMessage = getApiFootballPayloadError(data.errors);

  if (errorMessage) {
    throw new Error(errorMessage);
  }

  return data;
}

function findBestTeamMatch(
  teams: ApiFootballTeamResponse[],
  team: Team,
  configuredId: number | undefined,
): ApiFootballTeamResponse | undefined {
  const nationalTeams = teams.filter((item) => item.team?.national === true);
  const candidates = nationalTeams.length > 0 ? nationalTeams : teams;

  return (
    candidates.find((item) => configuredId !== undefined && item.team?.id === configuredId) ??
    candidates.find((item) => normalizeText(item.team?.name ?? "") === normalizeText(team.name)) ??
    candidates.find((item) => normalizeText(item.team?.code ?? "") === normalizeText(team.code)) ??
    candidates[0]
  );
}

function mapTeamProfile(item: ApiFootballTeamResponse, teamId: Team["id"]): ApiFootballTeamProfile | undefined {
  const team = item.team;

  if (!team?.id || !team.name || !team.country) {
    return undefined;
  }

  return {
    teamId,
    apiFootballTeamId: team.id,
    name: team.name,
    code: team.code,
    country: team.country,
    founded: team.founded,
    logoUrl: team.logo,
    venue: item.venue
      ? {
          name: item.venue.name,
          city: item.venue.city,
          capacity: item.venue.capacity,
          surface: item.venue.surface,
          imageUrl: item.venue.image,
        }
      : undefined,
    updatedAt: new Date().toISOString(),
  };
}

function mapFixtureContext(
  item: ApiFootballFixtureResponse,
  profile: ApiFootballTeamProfile,
): ApiFootballFixtureContext | undefined {
  const fixture = item.fixture;
  const home = item.teams?.home;
  const away = item.teams?.away;

  if (!fixture?.id || !fixture.date || !home?.name || !away?.name) {
    return undefined;
  }

  const isHome = home.id === profile.apiFootballTeamId;
  const isAway = away.id === profile.apiFootballTeamId;
  const opponent = isHome ? away : home;
  const status = mapFixtureStatus(fixture.status?.short);
  const goalsFor = isHome ? item.goals?.home ?? undefined : item.goals?.away ?? undefined;
  const goalsAgainst = isHome ? item.goals?.away ?? undefined : item.goals?.home ?? undefined;

  if (!isHome && !isAway) {
    return undefined;
  }

  return {
    fixtureId: fixture.id,
    teamId: profile.teamId,
    opponentName: opponent.name ?? "TBD",
    opponentLogoUrl: opponent.logo,
    homeAway: isHome ? "home" : "away",
    leagueName: item.league?.name,
    leagueRound: item.league?.round,
    venueName: fixture.venue?.name,
    city: fixture.venue?.city,
    kickoffAt: fixture.date,
    status,
    goalsFor,
    goalsAgainst,
    result: getFixtureResult(status, goalsFor, goalsAgainst),
    isWorldCupFixture: isWorldCupLeague(item.league?.name),
    updatedAt: new Date().toISOString(),
  };
}

function mapSquadPlayer(player: ApiFootballSquadPlayerResponse): ApiFootballSquadPlayer | undefined {
  if (!player.id || !player.name) {
    return undefined;
  }

  return {
    playerId: player.id,
    name: player.name,
    age: player.age,
    number: player.number,
    position: player.position,
    photoUrl: player.photo,
  };
}

function mapInjuryContext(item: ApiFootballInjuryResponse): ApiFootballInjuryContext | undefined {
  if (!item.player?.name) {
    return undefined;
  }

  return {
    playerId: item.player.id,
    playerName: item.player.name,
    playerPhotoUrl: item.player.photo,
    reason: item.player.reason,
    type: item.player.type,
    fixtureId: item.fixture?.id,
    fixtureDate: item.fixture?.date,
    leagueName: item.league?.name,
    updatedAt: new Date().toISOString(),
  };
}

function mapStandingContexts(item: ApiFootballStandingLeagueResponse): ApiFootballStandingContext[] {
  return (item.league?.standings ?? []).flatMap((group) =>
    group.map((standing) => ({
      leagueId: item.league?.id,
      leagueName: item.league?.name,
      season: item.league?.season,
      rank: standing.rank,
      group: standing.group,
      points: standing.points,
      played: standing.all?.played,
      wins: standing.all?.win,
      draws: standing.all?.draw,
      losses: standing.all?.lose,
      goalsFor: standing.all?.goals?.for,
      goalsAgainst: standing.all?.goals?.against,
      form: standing.form,
      status: standing.status,
      description: standing.description,
      updatedAt: new Date().toISOString(),
    })),
  );
}

function mapOddContexts(item: ApiFootballOddFixtureResponse): ApiFootballOddContext[] {
  if (!item.fixture?.id) {
    return [];
  }

  return (item.bookmakers ?? []).flatMap((bookmaker) =>
    (bookmaker.bets ?? []).flatMap((bet) =>
      (bet.values ?? []).map((value) => ({
        fixtureId: item.fixture?.id ?? 0,
        bookmaker: bookmaker.name,
        marketName: bet.name,
        selectionName: value.value,
        odd: value.odd,
        updatedAt: new Date().toISOString(),
      })),
    ),
  );
}

function isApiFootballTeamProfile(
  profile: ApiFootballTeamProfile | undefined,
): profile is ApiFootballTeamProfile {
  return Boolean(profile);
}

function isApiFootballTeamContext(
  context: ApiFootballTeamContext | undefined,
): context is ApiFootballTeamContext {
  return Boolean(context);
}

function isApiFootballFixtureContext(
  fixture: ApiFootballFixtureContext | undefined,
): fixture is ApiFootballFixtureContext {
  return Boolean(fixture);
}

function isApiFootballSquadPlayer(player: ApiFootballSquadPlayer | undefined): player is ApiFootballSquadPlayer {
  return Boolean(player);
}

function isApiFootballInjuryContext(
  injury: ApiFootballInjuryContext | undefined,
): injury is ApiFootballInjuryContext {
  return Boolean(injury);
}

async function collectDimension<T>(
  dimension: ApiFootballDataIssue["dimension"],
  load: () => Promise<T[]>,
): Promise<{ data: T[]; issues: ApiFootballDataIssue[] }> {
  try {
    return {
      data: await load(),
      issues: [],
    };
  } catch (error) {
    return {
      data: [],
      issues: [
        {
          dimension,
          message: getErrorMessage(error),
          capturedAt: new Date().toISOString(),
        },
      ],
    };
  }
}

function getApiFootballPayloadError(errors: unknown): string | undefined {
  if (!errors || (typeof errors === "object" && Object.keys(errors).length === 0)) {
    return undefined;
  }

  if (typeof errors === "string") {
    return errors;
  }

  if (typeof errors === "object") {
    return Object.values(errors)
      .map((value) => (typeof value === "string" ? value : JSON.stringify(value)))
      .join(" ");
  }

  return String(errors);
}

function mapFixtureStatus(status: string | undefined): ApiFootballFixtureContext["status"] {
  switch (status) {
    case "NS":
    case "TBD":
      return "scheduled";
    case "1H":
    case "HT":
    case "2H":
    case "ET":
    case "BT":
    case "P":
    case "SUSP":
    case "INT":
      return "live";
    case "FT":
    case "AET":
    case "PEN":
      return "finished";
    case "PST":
      return "postponed";
    case "CANC":
    case "ABD":
    case "AWD":
    case "WO":
      return "cancelled";
    default:
      return "unknown";
  }
}

function getFixtureResult(
  status: ApiFootballFixtureContext["status"],
  goalsFor: number | undefined,
  goalsAgainst: number | undefined,
): ApiFootballFixtureContext["result"] | undefined {
  if (status !== "finished" || goalsFor === undefined || goalsAgainst === undefined) {
    return undefined;
  }

  if (goalsFor > goalsAgainst) {
    return "W";
  }

  if (goalsFor < goalsAgainst) {
    return "L";
  }

  return "D";
}

function isWorldCupLeague(leagueName: string | undefined): boolean {
  if (!leagueName) {
    return false;
  }

  return normalizeText(leagueName).includes("world cup");
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "API-Football context unavailable.";
}
