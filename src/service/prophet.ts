import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig
} from "axios";

import type {
  ProphetAnalyticsCompetitiveness,
  ProphetAnalyticsRecommend,
  ProphetAnalyticsTeamPowerRanking,
  ProphetApiResponse,
  ProphetBindTelegramRequest,
  ProphetCancelTrackRequest,
  ProphetGetAnalyticsNewsData,
  ProphetGetGamesData,
  ProphetPolyMarketGameDetail,
  ProphetGetLatestAnalyticsNewsData,
  ProphetLoginData,
  ProphetLoginRequest,
  ProphetTrackRequest,
  ProphetUserTrackItem,
  ProphetUserTrackListItem
} from "@/types/prophet-api";

const AUTH_STORAGE_KEY = "prophet_api_token";
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

function resolveBaseUrl(): string {
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

export function getProphetApiToken(): string | null {
  return memoryToken ?? readStoredToken();
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
  }
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
    baseURL: resolveBaseUrl(),
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

/** GET /v1/games — all Polymarket games, sorted by start_time ascending */
export async function getProphetGames(): Promise<ProphetGetGamesData> {
  return prophetGet<ProphetGetGamesData>("/v1/games");
}

/** GET /v1/game — single Polymarket game by slug */
export async function getProphetGame(
  slug: string
): Promise<ProphetPolyMarketGameDetail> {
  return prophetGet<ProphetPolyMarketGameDetail>("/v1/game", {
    params: { slug }
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

  return data;
}

export function logoutProphet(): void {
  setProphetApiToken(null);
}

/** Sync Prophet session for the connected wallet; never throws. */
export async function syncProphetWalletLogin(
  address: string
): Promise<ProphetLoginData | null> {
  const normalizedAddress = normalizeWalletAddress(address);
  const existingToken = getProphetApiToken();
  const existingWallet = getProphetApiWallet();

  if (existingToken && existingWallet === normalizedAddress) {
    return { token: existingToken };
  }

  try {
    return await loginProphet({ address: normalizedAddress });
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
export async function bindProphetTelegram(
  request: ProphetBindTelegramRequest
): Promise<void> {
  requireProphetApiToken();
  await prophetPost<unknown>("/v1/user/bind/telegram", request);
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

/** POST /v1/user/untrack */
export async function untrackProphet(
  request: ProphetCancelTrackRequest
): Promise<void> {
  requireProphetApiToken();
  await prophetPost<unknown>("/v1/user/untrack", request);
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

/** GET /v1/analytics/news */
export async function getAnalyticsNews(params: {
  page: number;
  page_size: number;
  category?: string;
}): Promise<ProphetGetAnalyticsNewsData> {
  return prophetGet<ProphetGetAnalyticsNewsData>("/v1/analytics/news", {
    params: {
      page: params.page,
      page_size: params.page_size,
      category: params.category ?? ""
    }
  });
}

export { prophetClient };
