"use client";

import type { TradingUserSession, UserTradingReadiness } from "@/types/market";
import {
  getOrCreateQuickBidSessionSigner,
  isQuickBidSessionSignerAuthorized,
  writeQuickBidSessionSigner,
} from "@/components/trading/quick-bid-session-signer";
import { submitDepositWalletApproval, TokenApprovalPendingError } from "@/lib/trading/deposit-wallet-approval";
import { signTypedData } from "@/lib/trading/wallet-typed-data-sign";

export { signTypedData };

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
  const { deriveTradingCredentials } = await import("@/lib/trading/clob-credentials-client");
  await deriveTradingCredentials(session);
}

export async function authorizeQuickBidSessionSigner(
  session: TradingUserSession,
  sessionSignerAddress: string,
  onStatus?: (message: string) => void,
) {
  try {
    const { sessionSigner, transactionId } = await submitDepositWalletApproval(session, {
      sessionSignerAddress,
      onStatus,
      throwOnPending: false,
    });

    const signer = getOrCreateQuickBidSessionSigner(session.walletAddress);
    signer.authorizedUntil = sessionSigner?.sessionSignerValidUntil;
    signer.authorizationTransactionId = transactionId;
    writeQuickBidSessionSigner(signer);
  } catch (error) {
    if (error instanceof TokenApprovalPendingError) {
      throw new QuickBidApprovalPendingError(error.transactionId, undefined);
    }

    throw error;
  }
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
