import "server-only";

import type { AccountReadinessCheck, TradingUserSession, UserTradingReadiness } from "@/types/market";
import type { TradingSessionRecord } from "@/server/trading/session-store";
import { refreshDepositWalletDeployment, fetchDepositWalletRelayerReady } from "@/server/trading/deposit-wallet";
import { getTradingCredentialStatus, updateTradingSession } from "@/server/trading/session-store";
import {
  getReadableSetupAllowanceDetailForSession,
  getSetupAllowanceCheckStatusForSession,
} from "@/lib/trading/setup-allowance-readiness";
import {
  isSetupAllowanceCacheFresh,
} from "@/lib/trading/setup-allowance-cache";

export async function buildUserTradingReadiness({
  record,
}: {
  record?: TradingSessionRecord;
}): Promise<UserTradingReadiness> {
  const refreshedRecord = record ? await refreshDepositWalletSession(record) : undefined;
  const credentials = getTradingCredentialStatus(record?.session.userId, record?.session.sessionId);
  const session = refreshedRecord?.session;
  const onchainAllowances = resolveCachedSetupAllowances(session);
  const checks = createSetupChecks({
    session,
    hasCredentials: credentials.hasClobCredentials,
    onchainAllowances,
  });

  return {
    ready: checks.every((check) => check.status === "pass"),
    session,
    credentials,
    checks,
    updatedAt: new Date().toISOString(),
  };
}

function createSetupChecks({
  session,
  hasCredentials,
  onchainAllowances,
}: {
  session?: TradingUserSession;
  hasCredentials: boolean;
  onchainAllowances?: TradingUserSession["setupAllowances"];
}): AccountReadinessCheck[] {
  const setupAllowanceStatus = getSetupAllowanceCheckStatusForSession({
    onchainAllowances,
    hasCredentials,
    session,
  });

  return [
    {
      id: "wallet",
      label: "Wallet connected",
      status: session ? "pass" : "fail",
      detail: session ? session.walletAddress : "Connect a Polymarket-compatible wallet.",
    },
    {
      id: "signature_type",
      label: "Signature type",
      status: session?.signatureType === 3 ? "pass" : session ? "fail" : "unknown",
      detail: session ? `Using signature type ${session.signatureType}; deposit wallets require 3.` : "No session.",
    },
    {
      id: "funder",
      label: "Deposit wallet / funder",
      status: session?.funderAddress ? "pass" : session ? "fail" : "unknown",
      detail: session?.funderAddress ?? "Connect a wallet so the app can derive the user's Polymarket deposit wallet.",
    },
    {
      id: "deposit_wallet",
      label: "Deposit wallet deployment",
      status: getDepositWalletCheckStatus(session),
      detail: getDepositWalletDetail(session),
    },
    {
      id: "clob_credentials",
      label: "User CLOB credentials",
      status: hasCredentials ? "pass" : session ? "fail" : "unknown",
      detail: hasCredentials ? "User-specific credentials are held in this server session." : "Derive credentials from user L1 auth.",
    },
    {
      id: "allowance",
      label: "Allowance",
      status: setupAllowanceStatus,
      detail: getReadableSetupAllowanceDetailForSession({ onchainAllowances, hasCredentials, session }),
    },
  ];
}

function resolveCachedSetupAllowances(session: TradingUserSession | undefined) {
  if (!session?.funderAddress || session.depositWalletStatus !== "deployed") {
    return undefined;
  }

  if (isSetupAllowanceCacheFresh(session) && session.setupAllowances) {
    return session.setupAllowances;
  }

  return undefined;
}

function getDepositWalletCheckStatus(session: TradingUserSession | undefined): AccountReadinessCheck["status"] {
  if (!session) {
    return "unknown";
  }

  if (session.depositWalletStatus === "deployed") {
    return "pass";
  }

  if (session.depositWalletStatus === "deploying" || session.depositWalletStatus === "derived") {
    return "unknown";
  }

  return "fail";
}

function getDepositWalletDetail(session: TradingUserSession | undefined): string {
  if (!session) {
    return "Connect a wallet to derive the user's deposit wallet.";
  }

  const suffix = session.depositWalletCheckedAt ? ` Checked at ${session.depositWalletCheckedAt}.` : "";

  if (session.depositWalletStatus === "deployed") {
    return `Deposit wallet is deployed at ${session.funderAddress}.${suffix}`;
  }

  if (session.depositWalletStatus === "deploying") {
    return `Deposit wallet deployment is pending${session.depositWalletTransactionId ? ` (${session.depositWalletTransactionId})` : ""}.${suffix}`;
  }

  if (session.depositWalletStatus === "relayer_unconfigured") {
    return `${session.depositWalletError ?? "Relayer credentials are not configured."} Derived address: ${session.funderAddress ?? "unknown"}.`;
  }

  if (session.depositWalletStatus === "error") {
    return `${session.depositWalletError ?? "Deposit wallet deployment failed."}${suffix}`;
  }

  if (session.funderAddress) {
    return `Deposit wallet derived at ${session.funderAddress}; deployment status is not confirmed.${suffix}`;
  }

  return "Deposit wallet has not been derived.";
}

async function refreshDepositWalletSession(record: TradingSessionRecord): Promise<TradingSessionRecord> {
  const status = record.session.depositWalletStatus;

  if (!record.session.funderAddress || status === "relayer_unconfigured") {
    return record;
  }

  if (status === "deployed") {
    try {
      const deployment = await fetchDepositWalletRelayerReady(record.session.funderAddress);

      if (deployment) {
        return record;
      }
    } catch {
      return record;
    }
  }

  const refresh = await refreshDepositWalletDeployment(record.session);
  const session = updateTradingSession({
    ...record.session,
    depositWalletStatus: refresh.status,
    depositWalletCheckedAt: refresh.checkedAt,
    depositWalletTransactionHash: refresh.transactionHash ?? record.session.depositWalletTransactionHash,
    depositWalletError: refresh.error,
  });

  return {
    ...record,
    session,
  };
}
