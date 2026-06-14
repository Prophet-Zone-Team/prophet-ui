import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig
} from "axios";

import type {
  ProphetAnalyticsCompetitiveness,
  ProphetAnalyticsRecommend,
  ProphetAnalyticsTeamPathContext,
  ProphetAnalyticsTeamPowerRanking,
  ProphetAnalyticsTrackBatchRequest,
  ProphetAnalyticsTrackData,
  ProphetAnalyticsTrackRequest,
  ProphetApiResponse,
  ProphetBindTelegramRequest,
  ProphetCancelTrackRequest,
  ProphetGetAnalyticsNewsData,
  ProphetGetNewsTopCategoryImpactData,
  ProphetGetGamesData,
  ProphetGetTeamsConditionData,
  ProphetGetRelatedGamesData,
  ProphetGetTeamGameResultsData,
  ProphetGetHeadToHeadFixturesData,
  ProphetGetGameStatisticsData,
  ProphetGetGameOddsData,
  ProphetGameStatisticsPayload,
  ProphetPolyMarketGameDetail,
  ProphetGetLatestAnalyticsNewsData,
  ProphetGetTeamDetailData,
  ProphetGetTeamMarketNewsData,
  ProphetGetTeamRelatedNewsData,
  ProphetGetTelegramBindStatusData,
  ProphetGetUserTransactionsData,
  ProphetLoginData,
  ProphetLoginRequest,
  ProphetApplyReferralRequest,
  ProphetReferral,
  ProphetReportTransactionRequest,
  ProphetGetUserStrategiesData,
  ProphetSubmitStrategyData,
  ProphetSubmitStrategyRequest,
  ProphetUpdateStrategyTeamRequest,
  ProphetTrackRequest,
  ProphetTopTracksData,
  ProphetUserTrackItem,
  ProphetUserTrackListItem,
  ProphetLoginReferral,
  ProphetUploadData,
  ProphetGetPolymarketStatsData
} from "@/types/prophet-api";
import type { TokenPricesBySymbol } from "@/types/funding";
import type { TelegramLoginAuthData } from "@/types/telegram-widget";
import { clearReferralShareImageCache } from "@/lib/referral/referral-share-image-cache";

const AUTH_STORAGE_KEY = "prophet_api_token";
const REFERRAL_STORAGE_KEY = "prophet_api_referral";

export const PROPHET_API_TOKEN_CHANGED_EVENT = "prophet-api-token-changed";
const WALLET_STORAGE_KEY = "prophet_api_wallet";

const PROPHET_AUTH_REQUIRED_MESSAGE =
  "Connect your wallet to use this feature.";

export class ProphetApiError extends Error {
  readonly code: number;

  constructor(code: number, message: string) {
    super(message);
    this.name = "ProphetApiError";
    this.code = code;
  }
}

export function getProphetApiBaseUrl(): string {
  const override = process.env.NEXT_PUBLIC_PROPHET_API_URL?.trim();

  if (override) {
    return override.replace(/\/$/, "");
  }

  return process.env.NEXT_PUBLIC_ENV === "production"
    ? "https://api.prophet.zone"
    : "https://api_stg.prophet.zone";
}

function readStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(AUTH_STORAGE_KEY);
}

function writeStoredToken(token: string | null): void {
  if (typeof window === "undefined") {
    return;
  }

  if (token) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

function writeStoredReferral(referral: ProphetLoginReferral | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (referral) {
    window.localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(referral));
  } else {
    window.localStorage.removeItem(REFERRAL_STORAGE_KEY);
  }
}

function readStoredReferral(): ProphetLoginReferral | null {
  if (typeof window === "undefined") {
    return null;
  }

  const referral = window.localStorage.getItem(REFERRAL_STORAGE_KEY);
  return referral ? JSON.parse(referral) : null;
}

function readStoredWallet(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(WALLET_STORAGE_KEY);
}

function writeStoredWallet(wallet: string | null): void {
  if (typeof window === "undefined") {
    return;
  }

  if (wallet) {
    window.localStorage.setItem(WALLET_STORAGE_KEY, wallet);
  } else {
    window.localStorage.removeItem(WALLET_STORAGE_KEY);
  }
}

function normalizeWalletAddress(address: string): string {
  return address.toLowerCase();
}

let memoryToken: string | null = null;
let memoryWallet: string | null = null;
let memoryReferral: ProphetLoginReferral | null = null;

export function getProphetApiToken(): string | null {
  return memoryToken ?? readStoredToken();
}

export function getProphetReferral(): ProphetLoginReferral | null {
  return memoryReferral ?? readStoredReferral();
}

export function getProphetApiWallet(): string | null {
  return memoryWallet ?? readStoredWallet();
}

export function setProphetApiToken(token: string | null): void {
  memoryToken = token;
  writeStoredToken(token);

  if (!token) {
    memoryWallet = null;
    writeStoredWallet(null);
    setProphetReferral(null);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PROPHET_API_TOKEN_CHANGED_EVENT));
  }
}

export function setProphetReferral(referral: ProphetLoginReferral | null) {
  memoryReferral = referral;
  writeStoredReferral(referral);

  if (!referral) {
    memoryReferral = null;
    writeStoredReferral(null);
  }
}

export function patchProphetReferralCache(
  partial: Partial<ProphetLoginReferral>
): void {
  const existing = getProphetReferral();

  if (existing) {
    setProphetReferral({ ...existing, ...partial });
    return;
  }

  if (partial) {
    setProphetReferral(partial as ProphetLoginReferral);
  }
}

function readReferralCodeFromQuery(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const code = new URLSearchParams(window.location.search).get("r")?.trim();
  return code || null;
}

function shouldApplyReferralOnCache(
  code: string | null,
  referral: ProphetLoginReferral
): boolean {
  if (!code) {
    return false;
  }

  if (referral.has_bound_referral) {
    return false;
  }

  return code.toLowerCase() !== referral.referral_code.toLowerCase();
}

function setProphetApiWallet(wallet: string | null): void {
  memoryWallet = wallet ? normalizeWalletAddress(wallet) : null;
  writeStoredWallet(memoryWallet);
}

export function isProphetAuthenticated(): boolean {
  return Boolean(getProphetApiToken());
}

export function requireProphetApiToken(): string {
  const token = getProphetApiToken();

  if (!token) {
    throw new ProphetApiError(401, PROPHET_AUTH_REQUIRED_MESSAGE);
  }

  return token;
}

function attachAuthHeader(
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig {
  const token = getProphetApiToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}

function createProphetClient(): AxiosInstance {
  const client = axios.create({
    baseURL: getProphetApiBaseUrl(),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    timeout: 30_000
  });

  client.interceptors.request.use(attachAuthHeader);

  return client;
}

const prophetClient = createProphetClient();

function unwrapProphetResponse<T>(payload: ProphetApiResponse<T>): T {
  if (payload.code !== 0) {
    throw new ProphetApiError(
      payload.code,
      payload.message || "Prophet API request failed."
    );
  }

  return payload.data;
}

async function prophetGetRaw<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await prophetClient.get<T | ProphetApiResponse<T>>(url, config);
  const payload = response.data;

  if (
    payload &&
    typeof payload === "object" &&
    "code" in payload &&
    typeof (payload as ProphetApiResponse<T>).code === "number"
  ) {
    return unwrapProphetResponse(payload as ProphetApiResponse<T>);
  }

  return payload as T;
}

async function prophetGet<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await prophetClient.get<ProphetApiResponse<T>>(url, config);
  return unwrapProphetResponse(response.data);
}

async function prophetPost<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await prophetClient.post<ProphetApiResponse<T>>(
    url,
    body,
    config
  );
  return unwrapProphetResponse(response.data);
}

/** GET /v1/token/price — symbol to USD price map */
export async function getProphetTokenPrices(
  signal?: AbortSignal,
): Promise<TokenPricesBySymbol> {
  return prophetGet<TokenPricesBySymbol>("/v1/token/price", { signal });
}

/** GET /v1/polymarket/stats — aggregate Polymarket World Cup stats */
export async function getProphetPolymarketStats(
  signal?: AbortSignal,
): Promise<ProphetGetPolymarketStatsData> {
  return prophetGet<ProphetGetPolymarketStatsData>("/v1/polymarket/stats", {
    signal,
  });
}

/** GET /v1/games — all Polymarket games, sorted by start_time ascending */
export async function getProphetGames(): Promise<ProphetGetGamesData> {
  return prophetGet<ProphetGetGamesData>("/v1/games");
}

/** GET /v1/teams-condition — teams for comma-separated condition ids */
export async function getProphetTeamsCondition(params: {
  condition_ids: string;
}): Promise<ProphetGetTeamsConditionData> {
  return prophetGet<ProphetGetTeamsConditionData>("/v1/teams-condition", {
    params: {
      condition_ids: params.condition_ids
    }
  });
}

/** GET /v1/game — single Polymarket game by slug */
export async function getProphetGame(
  slug: string
): Promise<ProphetPolyMarketGameDetail> {
  return prophetGet<ProphetPolyMarketGameDetail>("/v1/game", {
    params: { slug }
  });
}

function parseGameStatisticsPayload(
  raw: ProphetGetGameStatisticsData
): ProphetGameStatisticsPayload {
  const json = raw.statistics?.trim();

  if (!json) {
    return { statistics: [], events: [] };
  }

  try {
    const parsed = JSON.parse(json) as Partial<ProphetGameStatisticsPayload>;

    return {
      statistics: Array.isArray(parsed.statistics) ? parsed.statistics : [],
      events: Array.isArray(parsed.events) ? parsed.events : []
    };
  } catch {
    throw new ProphetApiError(
      -1,
      "Unable to parse game statistics response."
    );
  }
}

/** GET /v1/game/odds — bookmaker odds by market category */
export async function getProphetGameOdds(params: {
  slug: string;
  signal?: AbortSignal;
}): Promise<ProphetGetGameOddsData> {
  return prophetGet<ProphetGetGameOddsData>("/v1/game/odds", {
    params: { slug: params.slug },
    signal: params.signal
  });
}

/** GET /v1/game/statistics — match statistics and events by slug */
export async function getProphetGameStatistics(params: {
  slug: string;
}): Promise<ProphetGameStatisticsPayload> {
  const data = await prophetGet<ProphetGetGameStatisticsData>(
    "/v1/game/statistics",
    {
      params: { slug: params.slug }
    }
  );

  return parseGameStatisticsPayload(data);
}

/** GET /v1/related-games — related games for comma-separated team names */
export async function getProphetRelatedGames(params: {
  teams: string;
}): Promise<ProphetGetRelatedGamesData> {
  return prophetGet<ProphetGetRelatedGamesData>("/v1/related-games", {
    params: {
      teams: params.teams
    }
  });
}

/** GET /v1/games/result — finished games for a team by name */
export async function getProphetTeamGameResults(params: {
  team_name: string;
}): Promise<ProphetGetTeamGameResultsData> {
  return prophetGet<ProphetGetTeamGameResultsData>("/v1/games/result", {
    params: {
      team_name: params.team_name
    }
  });
}

/** POST /v1/login — wallet login; creates account if missing */
export async function loginProphet(
  request: ProphetLoginRequest
): Promise<ProphetLoginData> {
  const data = await prophetPost<ProphetLoginData>("/v1/login", request);

  if (data.token) {
    setProphetApiToken(data.token);
    setProphetApiWallet(request.address);
  }

  if (data.referral) {
    setProphetReferral(data.referral);
  }

  return data;
}

export function logoutProphet(): void {
  setProphetApiToken(null);
  setProphetReferral(null);
  clearReferralShareImageCache();
}

/** POST /v1/upload — upload a binary file; returns CDN URL */
export async function uploadProphetFile(
  file: Blob,
  filename = "share-card.png",
): Promise<ProphetUploadData> {
  requireProphetApiToken();

  const formData = new FormData();
  formData.append("file", file, filename);

  return prophetPost<ProphetUploadData>("/v1/upload", formData, {
    headers: {
      "Content-Type": undefined,
    },
  });
}

/** GET /v1/user/referral */
export async function getProphetUserReferral(): Promise<ProphetReferral> {
  requireProphetApiToken();
  return prophetGet<ProphetReferral>("/v1/user/referral");
}

/** POST /v1/user/referral/apply */
export async function applyProphetReferral(
  request: ProphetApplyReferralRequest
): Promise<ProphetReferral> {
  requireProphetApiToken();
  const data = await prophetPost<ProphetReferral>(
    "/v1/user/referral/apply",
    request
  );
  setProphetReferral(data);
  return data;
}

/** Sync Prophet session for the connected wallet; never throws. */
export async function syncProphetWalletLogin(
  address: string,
  options?: { email?: string }
): Promise<ProphetLoginData | null> {
  const normalizedAddress = normalizeWalletAddress(address);
  const existingToken = getProphetApiToken();
  const existingWallet = getProphetApiWallet();
  const existingReferral = getProphetReferral();
  const referralCodeFromQuery = readReferralCodeFromQuery();

  // Re-login when email is available so returning Privy users can still
  // associate email after an earlier login raced without it.
  if (
    existingToken &&
    existingWallet === normalizedAddress &&
    existingReferral &&
    !options?.email
  ) {
    if (shouldApplyReferralOnCache(referralCodeFromQuery, existingReferral)) {
      try {
        await applyProphetReferral({
          referral_code: referralCodeFromQuery!
        });
      } catch (error) {
        console.warn("[prophet.referral] apply failed", error);
      }
    }

    return {
      token: existingToken,
      referral: existingReferral
    };
  }

  try {
    return await loginProphet({
      address: normalizedAddress,
      ...(options?.email ? { email: options.email } : {}),
      ...(referralCodeFromQuery
        ? { referral_code: referralCodeFromQuery }
        : {})
    });
  } catch (error) {
    console.warn("[prophet.login] wallet sync failed", error);
    return null;
  }
}

/** GET /v1/polymarket — proxy Polymarket GET */
export async function proxyPolymarketGet<T = unknown>(
  targetUrl: string,
  config?: AxiosRequestConfig
): Promise<T> {
  return prophetGetRaw<T>("/v1/polymarket", {
    ...config,
    params: {
      ...config?.params,
      target_url: targetUrl
    }
  });
}

/** POST /v1/polymarket — proxy Polymarket POST */
export async function proxyPolymarketPost<T = unknown>(
  targetUrl: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  return prophetPost<T>("/v1/polymarket", body, {
    ...config,
    params: {
      ...config?.params,
      target_url: targetUrl
    }
  });
}

/** POST /v1/user/bind/telegram */
export async function bindProphetTelegram(data: TelegramLoginAuthData): Promise<void> {
  requireProphetApiToken();
  await prophetPost<unknown>("/v1/user/bind/telegram", data);
}

/** GET /v1/user/bind/telegram/status */
export async function getProphetTelegramBindStatus(): Promise<ProphetGetTelegramBindStatusData> {
  requireProphetApiToken();
  return prophetGet<ProphetGetTelegramBindStatusData>(
    "/v1/user/bind/telegram/status"
  );
}

/** POST /v1/user/track */
export async function trackProphet(
  request: ProphetTrackRequest
): Promise<void> {
  requireProphetApiToken();
  await prophetPost<unknown>("/v1/user/track", request);
}

/** GET /v1/user/tracks */
export async function getProphetTracks(): Promise<ProphetUserTrackItem[]> {
  requireProphetApiToken();
  return prophetGet<ProphetUserTrackItem[]>("/v1/user/tracks");
}

/** GET /v1/user/tracks/list — lightweight subscription list for bookmark state */
export async function getProphetTrackList(): Promise<
  ProphetUserTrackListItem[]
> {
  requireProphetApiToken();
  return prophetGet<ProphetUserTrackListItem[]>("/v1/user/tracks/list");
}

/** GET /v1/user/tracks/top — most-tracked slugs per category (public) */
export async function getProphetTopTracks(): Promise<ProphetTopTracksData> {
  return prophetGet<ProphetTopTracksData>("/v1/user/tracks/top");
}

/** POST /v1/user/untrack */
export async function untrackProphet(
  request: ProphetCancelTrackRequest
): Promise<void> {
  requireProphetApiToken();
  await prophetPost<unknown>("/v1/user/untrack", request);
}

/** POST /v1/user/transaction — report trade; idempotent by tx_hash */
export async function reportProphetUserTransaction(
  request: ProphetReportTransactionRequest
): Promise<void> {
  requireProphetApiToken();
  await prophetPost<unknown>("/v1/user/transaction", request);
}

/** POST /v1/user/strategy — submit strategy and record per-team transactions */
export async function submitProphetUserStrategy(
  request: ProphetSubmitStrategyRequest
): Promise<ProphetSubmitStrategyData> {
  requireProphetApiToken();
  return prophetPost<ProphetSubmitStrategyData>("/v1/user/strategy", request);
}

/** POST /v1/user/strategy/item — append order data to an existing strategy team leg */
export async function updateProphetUserStrategyItem(
  request: ProphetUpdateStrategyTeamRequest
): Promise<void> {
  requireProphetApiToken();
  await prophetPost<unknown>("/v1/user/strategy/item", request);
}

/** GET /v1/user/strategies — all user strategies, newest first (no pagination) */
export async function getProphetUserStrategies(): Promise<ProphetGetUserStrategiesData> {
  requireProphetApiToken();
  return prophetGet<ProphetGetUserStrategiesData>("/v1/user/strategies");
}

/** GET /v1/user/transactions — paginated user-reported trades, newest first */
export async function getProphetUserTransactions(params: {
  page: number;
  page_size: number;
  type?: string;
}): Promise<ProphetGetUserTransactionsData> {
  requireProphetApiToken();
  return prophetGet<ProphetGetUserTransactionsData>("/v1/user/transactions", {
    params: {
      page: params.page,
      page_size: params.page_size,
      ...(params.type ? { type: params.type } : {})
    }
  });
}

/** POST /v1/analytics/track — product analytics events (list: 1-5); no auth required */
export async function trackProphetAnalyticsEvents(
  events: ProphetAnalyticsTrackBatchRequest["list"]
): Promise<ProphetAnalyticsTrackData> {
  if (events.length === 0) {
    throw new ProphetApiError(400, "Analytics track list cannot be empty.");
  }

  if (events.length > 5) {
    throw new ProphetApiError(
      400,
      "Analytics track list cannot contain more than 5 events."
    );
  }

  const body: ProphetAnalyticsTrackBatchRequest = { list: events };

  return prophetPost<ProphetAnalyticsTrackData>("/v1/analytics/track", body);
}

/** POST /v1/analytics/track — single product analytics event; no auth required */
export async function trackProphetAnalyticsEvent(
  request: ProphetAnalyticsTrackRequest
): Promise<ProphetAnalyticsTrackData> {
  return trackProphetAnalyticsEvents([request]);
}

/** GET /v1/analytics/competitiveness */
export async function getAnalyticsCompetitiveness(): Promise<
  ProphetAnalyticsCompetitiveness[]
> {
  return prophetGet<ProphetAnalyticsCompetitiveness[]>(
    "/v1/analytics/competitiveness"
  );
}

/** GET /v1/analytics/recommends */
export async function getAnalyticsRecommends(): Promise<
  ProphetAnalyticsRecommend[]
> {
  return prophetGet<ProphetAnalyticsRecommend[]>("/v1/analytics/recommends");
}

/** GET /v1/analytics/team-power-rankings */
export async function getAnalyticsTeamPowerRankings(): Promise<
  ProphetAnalyticsTeamPowerRanking[]
> {
  return prophetGet<ProphetAnalyticsTeamPowerRanking[]>(
    "/v1/analytics/team-power-rankings"
  );
}

/** GET /v1/analytics/team-path-context */
export async function getAnalyticsTeamPathContext(): Promise<
  ProphetAnalyticsTeamPathContext[]
> {
  return prophetGet<ProphetAnalyticsTeamPathContext[]>(
    "/v1/analytics/team-path-context"
  );
}

/** GET /v1/analytics/team */
export async function getAnalyticsTeamDetail(params: {
  team_name: string;
}): Promise<ProphetGetTeamDetailData> {
  return prophetGet<ProphetGetTeamDetailData>("/v1/analytics/team", {
    params: {
      team_name: params.team_name
    }
  });
}

/** GET /v1/analytics/team-market-news */
export async function getAnalyticsTeamMarketNews(params: {
  team_name: string;
}): Promise<ProphetGetTeamMarketNewsData> {
  return prophetGet<ProphetGetTeamMarketNewsData>("/v1/analytics/team-market-news", {
    params: {
      team_name: params.team_name
    }
  });
}

/** GET /v1/analytics/news/latest */
export async function getAnalyticsLatestNews(params?: {
  category?: string;
}): Promise<ProphetGetLatestAnalyticsNewsData> {
  return prophetGet<ProphetGetLatestAnalyticsNewsData>(
    "/v1/analytics/news/latest",
    {
      params: {
        category: params?.category ?? ""
      }
    }
  );
}

/** GET /v1/analytics/news/top-category-impact */
export async function getAnalyticsNewsTopCategoryImpact(): Promise<ProphetGetNewsTopCategoryImpactData> {
  return prophetGet<ProphetGetNewsTopCategoryImpactData>(
    "/v1/analytics/news/top-category-impact"
  );
}

/** GET /v1/analytics/news */
export async function getAnalyticsNews(params: {
  page: number;
  page_size: number;
  category?: string;
  teams?: string;
}): Promise<ProphetGetAnalyticsNewsData> {
  return prophetGet<ProphetGetAnalyticsNewsData>("/v1/analytics/news", {
    params: {
      page: params.page,
      page_size: params.page_size,
      category: params.category ?? "",
      teams: params.teams ?? ""
    }
  });
}

/** GET /v1/analytics/news/team-related */
export async function getAnalyticsTeamRelatedNews(params: {
  teams: string;
}): Promise<ProphetGetTeamRelatedNewsData> {
  return prophetGet<ProphetGetTeamRelatedNewsData>(
    "/v1/analytics/news/team-related",
    {
      params: {
        teams: params.teams
      }
    }
  );
}

/** GET /v1/analytics/fixtures/head-to-head */
export async function getAnalyticsHeadToHeadFixtures(params: {
  team_a: string;
  team_b: string;
}): Promise<ProphetGetHeadToHeadFixturesData> {
  return prophetGet<ProphetGetHeadToHeadFixturesData>(
    "/v1/analytics/fixtures/head-to-head",
    {
      params: {
        team_a: params.team_a,
        team_b: params.team_b
      }
    }
  );
}

export { prophetClient };
