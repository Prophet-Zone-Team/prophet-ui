"use client";

import { recoverTypedDataAddress } from "viem";
import type { Hex } from "viem";

import type { DepositWalletBatchSignablePayload } from "@/lib/market/deposit-wallet-batch";
import type { TradingUserSession, UserTradingReadiness } from "@/types/market";
import {
  getOrCreateQuickBidSessionSigner,
  isQuickBidSessionSignerAuthorized,
  writeQuickBidSessionSigner,
} from "@/components/trading/quick-bid-session-signer";
import { getStoredTradingWalletProvider } from "@/components/trading/trading-wallet-session";
import { getEthereumProvidersForWallet, getProviderLabel, type EthereumProvider } from "@/components/trading/wallet-provider";

interface TypedDataPayload {
  domain: unknown;
  types: Record<string, unknown>;
  primaryType: string;
  message: Record<string, unknown>;
}

interface ApprovalResponse {
  approval: DepositWalletBatchSignablePayload;
  sessionSigner?: {
    sessionSignerAddress?: string;
    sessionSignerValidUntil?: string;
  };
}

interface RelayerTransactionRecord {
  transactionID?: string;
  transactionHash?: string;
  state?: string;
}

export class QuickBidApprovalPendingError extends Error {
  transactionId: string;

  constructor(transactionId: string, state: string | undefined) {
    super(
      `Quick Bid approval was submitted and is still pending${state ? ` (${state})` : ""}. Wait a moment, then click Enable Quick Bid again to finish confirmation.`,
    );
    this.name = "QuickBidApprovalPendingError";
    this.transactionId = transactionId;
  }
}

export async function prepareQuickBidAccount({
  session,
  onStatus,
}: {
  session: TradingUserSession;
  onStatus?: (message: string) => void;
}) {
  if (!session.funderAddress) {
    throw new Error("Trading session is missing a Polymarket deposit wallet.");
  }

  let readiness = await loadReadiness();

  if (!readiness.credentials.hasClobCredentials) {
    onStatus?.("Sign once to derive your user-specific Polymarket CLOB credentials.");
    await deriveCredentials(session);
    readiness = await loadReadiness();
  }

  const quickBidSigner = getOrCreateQuickBidSessionSigner(session.walletAddress);

  if (!isQuickBidSessionSignerAuthorized(quickBidSigner)) {
    onStatus?.("Approve the Quick Bid session signer once.");
    await authorizeQuickBidSessionSigner(session, quickBidSigner.address, onStatus);
  }

  return {
    readiness,
    signer: getOrCreateQuickBidSessionSigner(session.walletAddress),
  };
}

export async function getQuickBidSetupIssue(session: TradingUserSession | undefined) {
  if (!session) {
    return "Connect wallet from the account menu before using Quick Bid.";
  }

  if (!session.funderAddress) {
    return "Polymarket deposit wallet is not ready yet.";
  }

  const readiness = await loadReadiness();

  if (!readiness.credentials.hasClobCredentials) {
    return "Enable Quick Bid in the account menu before placing one-click orders.";
  }

  const signer = getOrCreateQuickBidSessionSigner(session.walletAddress);

  if (!isQuickBidSessionSignerAuthorized(signer)) {
    return "Enable Quick Bid in the account menu before placing one-click orders.";
  }

  return undefined;
}

export async function deriveCredentials(session: TradingUserSession) {
  const { challenge } = await fetchJson<{ challenge: TypedDataPayload }>("/api/trading/credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mode: "challenge" }),
  });
  const signature = await signTypedData(session.walletAddress, challenge);
  const response = await fetchJson<{ credentials?: unknown }>("/api/trading/credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      signature,
      timestamp: String(challenge.message.timestamp ?? ""),
      nonce: String(challenge.message.nonce ?? "0"),
    }),
  });

  if (!response.credentials) {
    throw new Error("User CLOB credentials were not returned.");
  }
}

export async function authorizeQuickBidSessionSigner(
  session: TradingUserSession,
  sessionSignerAddress: string,
  onStatus?: (message: string) => void,
) {
  const search = new URLSearchParams({
    sessionSigner: sessionSignerAddress,
  });
  const { approval, sessionSigner } = await fetchJson<ApprovalResponse>(`/api/trading/approvals?${search.toString()}`);
  const signature = await signTypedData(session.walletAddress, approval);
  const response = await fetchJson<{ response?: { transactionID?: string; state?: string } }>("/api/trading/approvals", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      signature,
      nonce: approval.nonce,
      deadline: approval.deadline,
      approval,
      sessionSignerAddress: sessionSigner?.sessionSignerAddress,
      sessionSignerValidUntil: sessionSigner?.sessionSignerValidUntil,
    }),
  });

  if (response.response?.transactionID) {
    onStatus?.(`Quick Bid approval submitted. Checking confirmation...`);
    const confirmed = await waitForRelayerTransaction(response.response.transactionID, onStatus, {
      maxAttempts: 6,
      intervalMs: 1500,
      throwOnPending: false,
    });

    if (!confirmed) {
      throw new QuickBidApprovalPendingError(response.response.transactionID, undefined);
    }
  } else if (!response.response?.state) {
    throw new Error("Quick Bid approval did not return a relayer transaction id.");
  } else if (!isRelayerSuccessState(response.response.state)) {
    throw new Error(`Quick Bid approval transaction ${response.response.state}.`);
  }

  const signer = getOrCreateQuickBidSessionSigner(session.walletAddress);
  signer.authorizedUntil = sessionSigner?.sessionSignerValidUntil;
  signer.authorizationTransactionId = response.response?.transactionID;
  writeQuickBidSessionSigner(signer);
}

export async function signTypedData(walletAddress: string, typedData: unknown): Promise<string> {
  const providers = await getEthereumProvidersForWallet(walletAddress, getStoredTradingWalletProvider(walletAddress));
  const mismatches: string[] = [];
  let lastError: string | undefined;

  for (const provider of providers) {
    try {
      const activeWalletAddress = await requestWalletAccountAccess(provider, walletAddress);

      if (!activeWalletAddress || !isSameAddress(activeWalletAddress, walletAddress)) {
        lastError = activeWalletAddress
          ? `${getProviderLabel(provider)} active account is ${activeWalletAddress}, not ${walletAddress}.`
          : `${getProviderLabel(provider)} did not return an active account.`;
        continue;
      }

      const signature = await provider.request({
        method: "eth_signTypedData_v4",
        params: [activeWalletAddress, JSON.stringify(typedData)],
      });

      if (typeof signature !== "string" || !/^0x[a-fA-F0-9]+$/.test(signature)) {
        lastError = "Wallet did not return a valid signature.";
        continue;
      }

      const recoveredAddress = await recoverTypedDataAddress({
        ...toRecoverableTypedData(typedData),
        signature: signature as Hex,
      } as Parameters<typeof recoverTypedDataAddress>[0]);

      if (isSameAddress(recoveredAddress, walletAddress)) {
        return signature;
      }

      mismatches.push(`${recoveredAddress} from ${getProviderLabel(provider)}`);
    } catch (error) {
      lastError = getErrorMessage(error);
    }
  }

  const mismatchDetail =
    mismatches.length > 0
      ? ` Recovered signer(s): ${[...new Set(mismatches.map((address) => address.toLowerCase()))].join(", ")}.`
      : lastError
        ? ` Last wallet error: ${lastError}.`
        : "";

  throw new Error(
    `Unable to sign with connected wallet ${walletAddress}.${mismatchDetail} Disable conflicting wallet extensions, switch the active account to ${walletAddress}, then reconnect the intended wallet.`,
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const value = error as { message?: unknown; code?: unknown };
    const message = typeof value.message === "string" ? value.message : undefined;
    const code = typeof value.code === "string" || typeof value.code === "number" ? String(value.code) : undefined;

    if (message && code) {
      return `${message} (${code})`;
    }

    if (message) {
      return message;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return "Unknown wallet error.";
    }
  }

  return String(error);
}

export async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetchWithTimeout(input, init);
  const payload = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? `Request failed: ${response.status}`);
  }

  return payload;
}

async function loadReadiness() {
  return fetchJson<UserTradingReadiness>("/api/trading/readiness");
}

async function waitForRelayerTransaction(
  transactionId: string,
  onStatus?: (message: string) => void,
  options: {
    maxAttempts?: number;
    intervalMs?: number;
    throwOnPending?: boolean;
  } = {},
) {
  let lastState: string | undefined;
  const maxAttempts = options.maxAttempts ?? 60;
  const intervalMs = options.intervalMs ?? 2000;
  const throwOnPending = options.throwOnPending ?? true;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    await delay(intervalMs);

    const payload = await fetchJson<{ transaction?: RelayerTransactionRecord }>(
      `/api/trading/approvals?transactionId=${encodeURIComponent(transactionId)}`,
    );
    const state = payload.transaction?.state;
    lastState = state;

    if (isRelayerSuccessState(state)) {
      onStatus?.("Quick Bid approval confirmed. Finalizing setup...");
      return true;
    }

    if (isRelayerFailureState(state)) {
      throw new Error(`Quick Bid approval transaction ${state}.`);
    }

    onStatus?.(`Quick Bid approval is pending in relayer (${state ?? "unknown"})...`);
  }

  if (!throwOnPending) {
    return false;
  }

  throw new Error(
    `Quick Bid approval transaction ${transactionId} timed out before confirmation. Last state: ${
      lastState ?? "unknown"
    }. Refresh and retry Enable Quick Bid after a minute.`,
  );
}

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => {
    controller.abort();
  }, 20000);

  try {
    return await fetch(input, {
      ...init,
      signal: init?.signal ?? controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timed out while waiting for Quick Bid setup. Retry in a moment.");
    }

    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

function isRelayerSuccessState(state: string | undefined) {
  return Boolean(state && (state.includes("MINED") || state.includes("CONFIRMED") || state.includes("EXECUTED")));
}

function isRelayerFailureState(state: string | undefined) {
  return Boolean(state && (state.includes("FAILED") || state.includes("INVALID") || state.includes("REVERTED")));
}

async function requestWalletAccountAccess(provider: EthereumProvider, walletAddress: string) {
  if (provider.isMetaMask) {
    await provider
      .request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      })
      .catch(() => undefined);
  }

  const accounts = await provider
    .request({
      method: "eth_requestAccounts",
    })
    .catch(() => undefined);

  if (!Array.isArray(accounts)) {
    return undefined;
  }

  const accountList = accounts.filter((account): account is string => typeof account === "string");
  const matchingAccount = accountList.find((account) => isSameAddress(account, walletAddress));

  return matchingAccount ?? accountList[0];
}

function toRecoverableTypedData(typedData: unknown) {
  if (!typedData || typeof typedData !== "object") {
    throw new Error("Typed data payload is invalid.");
  }

  const payload = typedData as {
    domain?: unknown;
    types?: unknown;
    primaryType?: unknown;
    message?: unknown;
  };

  if (
    !payload.domain ||
    typeof payload.domain !== "object" ||
    !payload.types ||
    typeof payload.types !== "object" ||
    typeof payload.primaryType !== "string" ||
    !payload.message ||
    typeof payload.message !== "object"
  ) {
    throw new Error("Typed data payload is incomplete.");
  }

  return {
    domain: payload.domain,
    types: payload.types,
    primaryType: payload.primaryType,
    message: payload.message,
  };
}

function isSameAddress(left: string, right: string) {
  return left.toLowerCase() === right.toLowerCase();
}
