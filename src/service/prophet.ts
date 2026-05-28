import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig
} from "axios";

import type {
  ProphetApiResponse,
  ProphetBindTelegramRequest,
  ProphetCancelTrackRequest,
  ProphetGetGamesData,
  ProphetLoginData,
  ProphetLoginRequest,
  ProphetTrackRequest,
  ProphetUserTrackItem
} from "@/types/prophet-api";

const AUTH_STORAGE_KEY = "prophet_api_token";

export class ProphetApiError extends Error {
  readonly code: number;

  constructor(code: number, message: string) {
    super(message);
    this.name = "ProphetApiError";
    this.code = code;
  }
}

function resolveBaseUrl(): string {
  return process.env.MAIN_HOSTNAME === "dev.prophet.zone"
    ? "https://api_stg.prophet.zone"
    : "https://api.prophet.zone";
}

function readStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage.getItem(AUTH_STORAGE_KEY);
}

function writeStoredToken(token: string | null): void {
  if (typeof window === "undefined") {
    return;
  }

  if (token) {
    window.sessionStorage.setItem(AUTH_STORAGE_KEY, token);
  } else {
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

let memoryToken: string | null = null;

export function getProphetApiToken(): string | null {
  return memoryToken ?? readStoredToken();
}

export function setProphetApiToken(token: string | null): void {
  memoryToken = token;
  writeStoredToken(token);
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

/** POST /v1/login — wallet login; creates account if missing */
export async function loginProphet(
  request: ProphetLoginRequest
): Promise<ProphetLoginData> {
  const data = await prophetPost<ProphetLoginData>("/v1/login", request);

  if (data.token) {
    setProphetApiToken(data.token);
  }

  return data;
}

export function logoutProphet(): void {
  setProphetApiToken(null);
}

/** GET /v1/polymarket — proxy Polymarket GET */
export async function proxyPolymarketGet<T = unknown>(
  targetUrl: string,
  config?: AxiosRequestConfig
): Promise<T> {
  return prophetGet<T>("/v1/polymarket", {
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
  await prophetPost<unknown>("/v1/user/bind/telegram", request);
}

/** POST /v1/user/track */
export async function trackProphet(
  request: ProphetTrackRequest
): Promise<void> {
  await prophetPost<unknown>("/v1/user/track", request);
}

/** GET /v1/user/tracks */
export async function getProphetTracks(): Promise<ProphetUserTrackItem[]> {
  return prophetGet<ProphetUserTrackItem[]>("/v1/user/tracks");
}

/** POST /v1/user/untrack */
export async function untrackProphet(
  request: ProphetCancelTrackRequest
): Promise<void> {
  await prophetPost<unknown>("/v1/user/untrack", request);
}

export { prophetClient };
