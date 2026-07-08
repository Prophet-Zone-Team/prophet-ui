import { buildCopyTradeSignedRequestConfig } from "@/lib/copy-trade/wallet-auth";
import { signEvmMessage } from "@/lib/wallet/evm/evm-adapter";
import {
  CopyTradeApiError,
  copyTradeRequest,
} from "@/service/copy-trade/client";
import {
  createCopyTradeUser,
  createCopyTradeWallet,
  createCopyTradeWithdrawal,
  getCopyTradeWallet,
  sellCopyTradePosition,
} from "@/service/copy-trade/endpoints";
import type {
  CopySellRequest,
  CopyTradeManualSellResult,
  CopyWallet,
  CreateCopyTradeUserRequest,
  UserWithCopyWallet,
} from "@/types/copy-trade-api";
import type {
  CopyWithdrawal,
  CreateCopyWithdrawalRequest,
} from "@/types/copy-trade-funding";

interface WalletAuthMessageResponse {
  message: string;
  nonce: string;
  timestamp: number;
}

export interface CopyTradeWalletSession {
  wallet_address: string;
  expires_at: number;
}

export function normalizeCopyTradeWalletAddress(address: string): string {
  return address.trim().toLowerCase();
}

export function isCopyWalletReady(
  wallet: CopyWallet | null | undefined,
): boolean {
  return Boolean(
    wallet?.CopyDepositWalletAddress &&
      wallet.WalletStatus?.toLowerCase() === "deployed" &&
      wallet.CollateralApproved &&
      wallet.AutoRedeemApproved,
  );
}

export function shouldRefreshCopyWalletBeforeLiveCopy(
  wallet: CopyWallet | null | undefined,
): boolean {
  if (!wallet) {
    return true;
  }

  return (
    wallet.WalletStatus?.toLowerCase() !== "deployed" ||
    !wallet.CollateralApproved
  );
}

export async function refreshCopyWalletIfStale(
  userId: number,
  wallet: CopyWallet | null | undefined,
  updateCopyWallet: (copyWallet: CopyWallet | null) => void,
): Promise<CopyWallet | null | undefined> {
  if (!shouldRefreshCopyWalletBeforeLiveCopy(wallet)) {
    return wallet;
  }

  try {
    const refreshed = await fetchCopyTradeWallet(userId);
    updateCopyWallet(refreshed);
    return refreshed;
  } catch {
    return wallet;
  }
}

export function isCopyWalletPending(
  wallet: CopyWallet | null | undefined,
): boolean {
  if (!wallet) {
    return false;
  }

  const status = wallet.WalletStatus?.toLowerCase();
  if (status === "pending") {
    return true;
  }

  if (status === "deployed") {
    return !wallet.CollateralApproved || !wallet.AutoRedeemApproved;
  }

  return false;
}

export function resolveCopyWalletStatusLabel(
  wallet: CopyWallet | null | undefined,
): string {
  if (!wallet) {
    return "Not created";
  }

  if (isCopyWalletReady(wallet)) {
    return "Running";
  }

  if (wallet.WalletStatus?.toLowerCase() === "pending") {
    return "Deploying";
  }

  if (wallet.WalletStatus?.toLowerCase() === "deployed") {
    return "Awaiting approval";
  }

  return wallet.WalletStatus || "Unknown";
}

export async function loginCopyTradeWalletSession(
  walletAddress: string,
): Promise<CopyTradeWalletSession> {
  const account = normalizeCopyTradeWalletAddress(walletAddress);
  if (!account) {
    throw new Error("Wallet address is required.");
  }

  const auth = await copyTradeRequest<WalletAuthMessageResponse>(
    "POST",
    "/auth/message",
    { wallet_address: account },
  );

  const signature = await signEvmMessage(account, auth.message);

  return copyTradeRequest<CopyTradeWalletSession>("POST", "/auth/session", {
    wallet_address: account,
    nonce: auth.nonce,
    timestamp: auth.timestamp,
    signature,
  });
}

export async function logoutCopyTradeWalletSession(): Promise<void> {
  await copyTradeRequest<{ ok: boolean }>("DELETE", "/auth/session");
}

export async function loadCopyTradeUser(
  walletAddress: string,
  email = "",
): Promise<UserWithCopyWallet> {
  const account = normalizeCopyTradeWalletAddress(walletAddress);
  const body: CreateCopyTradeUserRequest = {
    external_id: account,
    email,
    web_wallet_address: account,
  };

  return createCopyTradeUser(body);
}

export async function fetchCopyTradeWallet(
  userId: number,
): Promise<CopyWallet | null> {
  try {
    return await getCopyTradeWallet(userId);
  } catch (error) {
    if (error instanceof CopyTradeApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function createCopyTradeWalletSigned(
  walletAddress: string,
  userId: number,
): Promise<CopyWallet> {
  const account = normalizeCopyTradeWalletAddress(walletAddress);
  const path = `/users/${userId}/copy-wallet`;
  const signedConfig = await buildCopyTradeSignedRequestConfig(
    account,
    "POST",
    path,
  );

  return createCopyTradeWallet(userId, signedConfig);
}

export async function submitCopyTradeWithdrawalSigned(
  walletAddress: string,
  userId: number,
  body: CreateCopyWithdrawalRequest,
): Promise<CopyWithdrawal> {
  const account = normalizeCopyTradeWalletAddress(walletAddress);
  if (!account) {
    throw new Error("Wallet address is required.");
  }

  const path = `/users/${userId}/withdrawals`;
  const signedConfig = await buildCopyTradeSignedRequestConfig(
    account,
    "POST",
    path,
    body,
  );

  return createCopyTradeWithdrawal(userId, body, signedConfig);
}

export async function submitCopyTradeSellSigned(
  walletAddress: string,
  userId: number,
  body: CopySellRequest,
): Promise<CopyTradeManualSellResult> {
  const account = normalizeCopyTradeWalletAddress(walletAddress);
  if (!account) {
    throw new Error("Wallet address is required.");
  }

  const path = `/users/${userId}/copy-sell`;
  const signedConfig = await buildCopyTradeSignedRequestConfig(
    account,
    "POST",
    path,
    body,
  );

  return sellCopyTradePosition(userId, body, signedConfig);
}

export async function verifyCopyTradeSessionCookie(
  userId: number,
): Promise<boolean> {
  try {
    await copyTradeRequest("GET", `/users/${userId}/balances`);
    return true;
  } catch {
    return false;
  }
}

export async function pollCopyTradeWalletReady(
  userId: number,
  options?: {
    intervalMs?: number;
    timeoutMs?: number;
    onUpdate?: (wallet: CopyWallet) => void;
  },
): Promise<CopyWallet | null> {
  const intervalMs = options?.intervalMs ?? 2000;
  const timeoutMs = options?.timeoutMs ?? 30000;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const wallet = await fetchCopyTradeWallet(userId);
    if (wallet) {
      options?.onUpdate?.(wallet);
      if (isCopyWalletReady(wallet)) {
        return wallet;
      }
    }

    await new Promise((resolve) => {
      window.setTimeout(resolve, intervalMs);
    });
  }

  return fetchCopyTradeWallet(userId);
}
