import type { AxiosRequestConfig } from "axios";

import type {
  CopyPnLSummary,
  CopyProfile,
  CopyProfileUpdateRequest,
  CopySellRequest,
  CopyTarget,
  CopyTargetsUpdateRequest,
  CopyTargetsUpdateResponse,
  CopyTradeBalance,
  CopyTradeManualSellResult,
  CopyTradePlatformMetrics,
  CopyTradeSellableBalance,
  CopyTradeUserOrder,
  CopyTradersListResponse,
  CopyTraderTracksLatestResponse,
  CopyTraderTracksListResponse,
  CopyWallet,
  CreateCopyTradeUserRequest,
  ImportCopyTraderResponse,
  TrackCopyTraderResponse,
  UserWithCopyWallet
} from "@/types/copy-trade-api";

import { copyTradeRequest } from "./client";

function userPath(userId: number, suffix: string): string {
  return `/users/${userId}/${suffix}`;
}

/** POST /users — create or load a copy-trade user */
export async function createCopyTradeUser(
  body: CreateCopyTradeUserRequest,
  config?: AxiosRequestConfig
): Promise<UserWithCopyWallet> {
  return copyTradeRequest<UserWithCopyWallet>("POST", "/users", body, config);
}

/** GET /users/{id}/copy-profile */
export async function getCopyTradeProfile(
  userId: number,
  config?: AxiosRequestConfig
): Promise<CopyProfile> {
  return copyTradeRequest<CopyProfile>(
    "GET",
    userPath(userId, "copy-profile"),
    undefined,
    config
  );
}

/** PUT /users/{id}/copy-profile */
export async function updateCopyTradeProfile(
  userId: number,
  body: CopyProfileUpdateRequest,
  config?: AxiosRequestConfig
): Promise<CopyProfile> {
  return copyTradeRequest<CopyProfile>(
    "PUT",
    userPath(userId, "copy-profile"),
    body,
    config
  );
}

/** GET /users/{id}/copy-targets */
export async function getCopyTradeTargets(
  userId: number,
  config?: AxiosRequestConfig
): Promise<CopyTarget[]> {
  return copyTradeRequest<CopyTarget[]>(
    "GET",
    userPath(userId, "copy-targets"),
    undefined,
    config
  );
}

/** PUT /users/{id}/copy-targets */
export async function updateCopyTradeTargets(
  userId: number,
  body: CopyTargetsUpdateRequest,
  config?: AxiosRequestConfig
): Promise<CopyTargetsUpdateResponse> {
  return copyTradeRequest<CopyTargetsUpdateResponse>(
    "PUT",
    userPath(userId, "copy-targets"),
    body,
    config
  );
}

/** GET /users/{id}/copy-wallet */
export async function getCopyTradeWallet(
  userId: number,
  config?: AxiosRequestConfig
): Promise<CopyWallet> {
  return copyTradeRequest<CopyWallet>(
    "GET",
    userPath(userId, "copy-wallet"),
    undefined,
    config
  );
}

/** POST /users/{id}/copy-wallet — requires wallet signature headers */
export async function createCopyTradeWallet(
  userId: number,
  config?: AxiosRequestConfig
): Promise<CopyWallet> {
  return copyTradeRequest<CopyWallet>(
    "POST",
    userPath(userId, "copy-wallet"),
    undefined,
    config
  );
}

/** GET /users/{id}/balances */
export async function getCopyTradeBalances(
  userId: number,
  config?: AxiosRequestConfig
): Promise<CopyTradeBalance> {
  return copyTradeRequest<CopyTradeBalance>(
    "GET",
    userPath(userId, "balances"),
    undefined,
    config
  );
}

/** GET /users/{id}/orders */
export async function listCopyTradeOrders(
  userId: number,
  config?: AxiosRequestConfig
): Promise<CopyTradeUserOrder[]> {
  return copyTradeRequest<CopyTradeUserOrder[]>(
    "GET",
    userPath(userId, "orders"),
    undefined,
    config
  );
}

/** GET /users/{id}/copy-pnl */
export async function getCopyTradePnL(
  userId: number,
  config?: AxiosRequestConfig
): Promise<CopyPnLSummary> {
  return copyTradeRequest<CopyPnLSummary>(
    "GET",
    userPath(userId, "copy-pnl"),
    undefined,
    config
  );
}

/** GET /users/{id}/copy-sell?token_id=... */
export async function getCopyTradeSellableBalance(
  userId: number,
  tokenId: string,
  config?: AxiosRequestConfig
): Promise<CopyTradeSellableBalance> {
  return copyTradeRequest<CopyTradeSellableBalance>(
    "GET",
    userPath(userId, "copy-sell"),
    undefined,
    {
      ...config,
      params: {
        ...config?.params,
        token_id: tokenId
      }
    }
  );
}

/** POST /users/{id}/copy-sell — requires wallet signature headers */
export async function sellCopyTradePosition(
  userId: number,
  body: CopySellRequest,
  config?: AxiosRequestConfig
): Promise<CopyTradeManualSellResult> {
  return copyTradeRequest<CopyTradeManualSellResult>(
    "POST",
    userPath(userId, "copy-sell"),
    body,
    config
  );
}

/** GET /copy-traders */
export async function listCopyTraders(
  config?: AxiosRequestConfig
): Promise<CopyTradersListResponse> {
  return copyTradeRequest<CopyTradersListResponse>(
    "GET",
    "/copy-traders",
    undefined,
    config
  );
}

/** POST /copy-traders/import */
export async function importCopyTrader(
  wallet: string,
  config?: AxiosRequestConfig
): Promise<ImportCopyTraderResponse> {
  return copyTradeRequest<ImportCopyTraderResponse>(
    "POST",
    "/copy-traders/import",
    { wallet: wallet.trim().toLowerCase() },
    config
  );
}

/** GET /copy-traders/tracks */
export async function listCopyTraderTracks(
  config?: AxiosRequestConfig
): Promise<CopyTraderTracksListResponse> {
  return copyTradeRequest<CopyTraderTracksListResponse>(
    "GET",
    "/copy-traders/tracks",
    undefined,
    config
  );
}

/** POST /copy-traders/tracks */
export async function trackCopyTrader(
  wallet: string,
  config?: AxiosRequestConfig
): Promise<TrackCopyTraderResponse> {
  return copyTradeRequest<TrackCopyTraderResponse>(
    "POST",
    "/copy-traders/tracks",
    { wallet: wallet.trim().toLowerCase() },
    config
  );
}

/** DELETE /copy-traders/tracks/{wallet} */
export async function untrackCopyTrader(
  wallet: string,
  config?: AxiosRequestConfig
): Promise<TrackCopyTraderResponse> {
  return copyTradeRequest<TrackCopyTraderResponse>(
    "DELETE",
    `/copy-traders/tracks/${encodeURIComponent(wallet.trim().toLowerCase())}`,
    undefined,
    config
  );
}

/** GET /copy-traders/tracks/latest */
export async function listCopyTraderTracksLatest(
  limit?: number,
  config?: AxiosRequestConfig
): Promise<CopyTraderTracksLatestResponse> {
  return copyTradeRequest<CopyTraderTracksLatestResponse>(
    "GET",
    "/copy-traders/tracks/latest",
    undefined,
    {
      ...config,
      params: {
        ...config?.params,
        ...(limit != null ? { limit } : {})
      }
    }
  );
}

/** GET /platform-metrics */
export async function getCopyTradePlatformMetrics(
  config?: AxiosRequestConfig
): Promise<CopyTradePlatformMetrics> {
  return copyTradeRequest<CopyTradePlatformMetrics>(
    "GET",
    "/platform-metrics",
    undefined,
    config
  );
}
