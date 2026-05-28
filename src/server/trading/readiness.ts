import "server-only";

import type { AccountReadinessCheck, TradingUserSession, UserTradingReadiness } from "@/types/market";
import type { TradingSessionRecord } from "@/server/trading/session-store";
import { refreshDepositWalletDeployment } from "@/server/trading/deposit-wallet";
import {
  fetchOnchainCollateralSnapshot,
  type OnchainCollateralSnapshot,
} from "@/server/trading/onchain-balances";
import { getTradingCredentialStatus, updateTradingSession } from "@/server/trading/session-store";
import { isTradingTokenAllowanceAuthorized } from "@/lib/trading/trading-allowance-setup";
import {
  isSetupAllowanceCacheFresh,
  withSetupAllowanceCache,
} from "@/lib/trading/setup-allowance-cache";

export async function buildUserTradingReadiness({
  record,
}: {
  record?: TradingSessionRecord;
}): Promise<UserTradingReadiness> {
  const refreshedRecord = record ? await refreshDepositWalletSession(record) : undefined;
  const credentials = getTradingCredentialStatus(record?.session.userId, record?.session.sessionId);
  const session = refreshedRecord?.session;
  const { session: sessionWithAllowances, onchainAllowances } = await resolveSetupOnchainAllowances(session);
  const checks = createSetupChecks({
    session: sessionWithAllowances,
    hasCredentials: credentials.hasClobCredentials,
    onchainAllowances,
  });

  return {
    ready: checks.every((check) => check.status === "pass"),
    session: sessionWithAllowances,
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
  onchainAllowances?: OnchainCollateralSnapshot["allowances"];
}): AccountReadinessCheck[] {
  const setupAllowanceStatus = getSetupAllowanceCheckStatus({
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
      detail: getReadableSetupAllowanceDetail({ onchainAllowances, hasCredentials, session }),
    },
  ];
}

async function resolveSetupOnchainAllowances(session: TradingUserSession | undefined): Promise<{
  session?: TradingUserSession;
  onchainAllowances?: OnchainCollateralSnapshot["allowances"];
}> {
  if (!session?.funderAddress || session.depositWalletStatus !== "deployed") {
    return { session };
  }

  if (isSetupAllowanceCacheFresh(session) && session.setupAllowances) {
    return {
      session,
      onchainAllowances: session.setupAllowances,
    };
  }

  const snapshot = await fetchOnchainCollateralSnapshot(session.funderAddress);
  const allowances = snapshot.allowances;

  if (!allowances) {
    return { session, onchainAllowances: allowances };
  }

  const updatedSession = withSetupAllowanceCache(
    session,
    allowances,
    snapshot.updatedAt,
  );
  updateTradingSession(updatedSession);

  return {
    session: updatedSession,
    onchainAllowances: allowances,
  };
}

function getSetupAllowanceCheckStatus({
  onchainAllowances,
  hasCredentials,
  session,
}: {
  onchainAllowances?: OnchainCollateralSnapshot["allowances"];
  hasCredentials: boolean;
  session?: TradingUserSession;
}): AccountReadinessCheck["status"] {
  if (isTradingTokenAllowanceAuthorized(onchainAllowances)) {
    return "pass";
  }

  if (onchainAllowances) {
    return "fail";
  }

  if (session?.depositWalletStatus === "deployed") {
    return "unknown";
  }

  return hasCredentials || session ? "fail" : "unknown";
}

function getReadableSetupAllowanceDetail({
  onchainAllowances,
  hasCredentials,
  session,
}: {
  onchainAllowances?: OnchainCollateralSnapshot["allowances"];
  hasCredentials: boolean;
  session?: TradingUserSession;
}) {
  if (isTradingTokenAllowanceAuthorized(onchainAllowances)) {
    return "Required USDC allowances are approved on-chain for trading.";
  }

  if (onchainAllowances) {
    const missing = [
      onchainAllowances.conditionalTokens === undefined || onchainAllowances.conditionalTokens <= 0
        ? "conditional tokens"
        : undefined,
      onchainAllowances.exchange === undefined || onchainAllowances.exchange <= 0 ? "exchange" : undefined,
      onchainAllowances.negRiskExchange === undefined || onchainAllowances.negRiskExchange <= 0
        ? "neg-risk exchange"
        : undefined,
      onchainAllowances.negRiskAdapter === undefined || onchainAllowances.negRiskAdapter <= 0
        ? "neg-risk adapter"
        : undefined,
    ].filter(Boolean);

    return missing.length > 0
      ? `Missing on-chain USDC allowance for ${missing.join(", ")}.`
      : "Required USDC allowances are not approved yet.";
  }

  if (session?.depositWalletStatus !== "deployed") {
    return "Deploy the deposit wallet before checking token allowances.";
  }

  return hasCredentials ? "Allowance could not be read." : "Allowance requires a deployed deposit wallet.";
}

async function refreshDepositWalletSession(record: TradingSessionRecord): Promise<TradingSessionRecord> {
  const status = record.session.depositWalletStatus;

  if (!record.session.funderAddress || status === "deployed" || status === "relayer_unconfigured") {
    return record;
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
