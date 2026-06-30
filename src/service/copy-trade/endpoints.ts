import type { AxiosRequestConfig } from "axios";

import type {
  CopyPnLPointsResponse,
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
  CopyWallet,
  CreateCopyTradeUserRequest,
  UserWithCopyWallet
} from "@/types/copy-trade-api";
import type {
  CopyBridgeSupportedAsset,
  CopyDepositAddress,
  CopyDepositStatusResult,
  CopyWithdrawal,
  CopyWithdrawalAssetInfo,
  CopyWithdrawalReadiness,
  CreateCopyWithdrawalRequest
} from "@/types/copy-trade-funding";

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

/** GET /users/{id}/copy-pnl/points */
export async function getCopyTradePnLPoints(
  userId: number,
  config?: AxiosRequestConfig
): Promise<CopyPnLPointsResponse> {
  return copyTradeRequest<CopyPnLPointsResponse>(
    "GET",
    userPath(userId, "copy-pnl/points"),
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

/** POST /users/{id}/deposit/address — get or refresh the bridge deposit address */
export async function createCopyTradeDepositAddress(
  userId: number,
  config?: AxiosRequestConfig
): Promise<CopyDepositAddress> {
  return copyTradeRequest<CopyDepositAddress>(
    "POST",
    userPath(userId, "deposit/address"),
    undefined,
    config
  );
}

/** GET /users/{id}/deposit/status — poll bridge transactions and credited pUSD */
export async function getCopyTradeDepositStatus(
  userId: number,
  config?: AxiosRequestConfig
): Promise<CopyDepositStatusResult> {
  return copyTradeRequest<CopyDepositStatusResult>(
    "GET",
    userPath(userId, "deposit/status"),
    undefined,
    config
  );
}

/** GET /copy-deposit/supported-assets */
export async function getCopyTradeDepositSupportedAssets(
  config?: AxiosRequestConfig
): Promise<CopyBridgeSupportedAsset[]> {
  const response = await copyTradeRequest<{ items: CopyBridgeSupportedAsset[] }>(
    "GET",
    "/copy-deposit/supported-assets",
    undefined,
    config
  );

  return response.items ?? [];
}

/** GET /copy-withdrawal/supported-assets */
export async function getCopyTradeWithdrawalSupportedAssets(
  config?: AxiosRequestConfig
): Promise<CopyWithdrawalAssetInfo[]> {
  const response = await copyTradeRequest<{ items: CopyWithdrawalAssetInfo[] }>(
    "GET",
    "/copy-withdrawal/supported-assets",
    undefined,
    config
  );

  return response.items ?? [];
}

/** GET /users/{id}/withdrawals — withdrawal history (latest first) */
export async function listCopyTradeWithdrawals(
  userId: number,
  config?: AxiosRequestConfig
): Promise<CopyWithdrawal[]> {
  return copyTradeRequest<CopyWithdrawal[]>(
    "GET",
    userPath(userId, "withdrawals"),
    undefined,
    config
  );
}

/** GET /users/{id}/withdrawals/readiness */
export async function getCopyTradeWithdrawalReadiness(
  userId: number,
  config?: AxiosRequestConfig
): Promise<CopyWithdrawalReadiness> {
  return copyTradeRequest<CopyWithdrawalReadiness>(
    "GET",
    userPath(userId, "withdrawals/readiness"),
    undefined,
    config
  );
}

/** POST /users/{id}/withdrawals — requires wallet signature headers */
export async function createCopyTradeWithdrawal(
  userId: number,
  body: CreateCopyWithdrawalRequest,
  config?: AxiosRequestConfig
): Promise<CopyWithdrawal> {
  return copyTradeRequest<CopyWithdrawal>(
    "POST",
    userPath(userId, "withdrawals"),
    body,
    config
  );
}
