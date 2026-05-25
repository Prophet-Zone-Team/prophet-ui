"use client";

import type { DepositWalletBatchSignablePayload } from "@/lib/market/deposit-wallet-batch";
import type { TradingUserSession } from "@/types/market";

import { fetchJson } from "@/lib/team/client-fetch";
import { signTypedData } from "@/lib/trading/wallet-typed-data-sign";

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

export class TokenApprovalPendingError extends Error {
  transactionId: string;

  constructor(transactionId: string, state: string | undefined) {
    super(
      `Token approval was submitted and is still pending${state ? ` (${state})` : ""}. Wait a moment, then try signing again.`,
    );
    this.name = "TokenApprovalPendingError";
    this.transactionId = transactionId;
  }
}

export async function submitDepositWalletApproval(
  session: TradingUserSession,
  options?: {
    sessionSignerAddress?: string;
    onStatus?: (message: string) => void;
    throwOnPending?: boolean;
  },
) {
  if (!session.funderAddress) {
    throw new Error("Trading session is missing a Polymarket deposit wallet.");
  }

  const search = new URLSearchParams();

  if (options?.sessionSignerAddress) {
    search.set("sessionSigner", options.sessionSignerAddress);
  }

  const query = search.size > 0 ? `?${search.toString()}` : "";
  const { approval, sessionSigner } = await fetchJson<ApprovalResponse>(
    `/api/trading/approvals${query}`,
  );
  const signature = await signTypedData(session.walletAddress, approval);
  const response = await fetchJson<{ response?: { transactionID?: string; state?: string } }>(
    "/api/trading/approvals",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        signature,
        nonce: approval.message.nonce,
        deadline: approval.message.deadline,
        approval,
        sessionSignerAddress: sessionSigner?.sessionSignerAddress,
        sessionSignerValidUntil: sessionSigner?.sessionSignerValidUntil,
      }),
    },
  );

  if (response.response?.transactionID) {
    options?.onStatus?.("Token approval submitted. Checking confirmation...");
    const confirmed = await waitForRelayerTransaction(response.response.transactionID, options?.onStatus, {
      maxAttempts: 6,
      intervalMs: 1500,
      throwOnPending: options?.throwOnPending ?? false,
    });

    if (!confirmed) {
      throw new TokenApprovalPendingError(response.response.transactionID, undefined);
    }
  } else if (!response.response?.state) {
    throw new Error("Token approval did not return a relayer transaction id.");
  } else if (!isRelayerSuccessState(response.response.state)) {
    throw new Error(`Token approval transaction ${response.response.state}.`);
  }

  return {
    sessionSigner,
    transactionId: response.response?.transactionID,
  };
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
      onStatus?.("Token approval confirmed.");
      return true;
    }

    if (isRelayerFailureState(state)) {
      throw new Error(`Token approval transaction ${state}.`);
    }

    onStatus?.(`Token approval is pending in relayer (${state ?? "unknown"})...`);
  }

  if (!throwOnPending) {
    return false;
  }

  throw new Error(
    `Token approval transaction ${transactionId} timed out before confirmation. Last state: ${
      lastState ?? "unknown"
    }.`,
  );
}

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function isRelayerSuccessState(state: string | undefined) {
  return Boolean(state && (state.includes("MINED") || state.includes("CONFIRMED") || state.includes("EXECUTED")));
}

function isRelayerFailureState(state: string | undefined) {
  return Boolean(state && (state.includes("FAILED") || state.includes("INVALID") || state.includes("REVERTED")));
}
