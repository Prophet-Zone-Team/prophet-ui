import "server-only";

import type {
  AccountReadinessCheck,
  BidTradeSide,
  TradingUserSession,
  UserBalanceSnapshot,
  UserTradingReadiness,
} from "../../types/market";
import type { TradingSessionRecord } from "./sessionStore";
import {
  checkOrderFunding,
  fetchUserBalanceSnapshot,
  resolveOrderFundingRequirementWithFees,
  type OrderFundingRequirement,
} from "./balances";
import { refreshDepositWalletDeployment } from "./depositWallet";
import { getTradingCredentialStatus, updateTradingSession } from "./sessionStore";

export async function buildUserTradingReadiness({
  record,
  tokenId,
  fundingRequirement,
}: {
  record?: TradingSessionRecord;
  tokenId?: string;
  fundingRequirement?: OrderFundingRequirement;
}): Promise<UserTradingReadiness> {
  const refreshedRecord = record ? await refreshDepositWalletSession(record) : undefined;
  const credentials = getTradingCredentialStatus(record?.session.userId);
  const balances = refreshedRecord?.credentials
    ? await fetchUserBalanceSnapshot({
        session: refreshedRecord.session,
        credentials: refreshedRecord.credentials,
        tokenId,
      })
    : undefined;
  const resolvedFundingRequirement =
    fundingRequirement && tokenId
      ? await resolveOrderFundingRequirementWithFees(fundingRequirement, tokenId)
      : fundingRequirement;
  const checks = createChecks({
    session: refreshedRecord?.session,
    hasCredentials: credentials.hasClobCredentials,
    balances,
    fundingRequirement: resolvedFundingRequirement,
  });

  return {
    ready: checks.every((check) => check.status === "pass"),
    session: refreshedRecord?.session,
    credentials,
    balances,
    checks,
    updatedAt: new Date().toISOString(),
  };
}

function createChecks({
  session,
  hasCredentials,
  balances,
  fundingRequirement,
}: {
  session?: TradingUserSession;
  hasCredentials: boolean;
  balances?: UserBalanceSnapshot;
  fundingRequirement?: OrderFundingRequirement;
}): AccountReadinessCheck[] {
  const funding = checkOrderFunding({
    balances,
    requirement: fundingRequirement,
  });

  return [
    {
      id: "wallet",
      label: "Wallet connected",
      status: session ? "pass" : "fail",
      detail: session ? session.walletAddress : "Connect a Polymarket-compatible wallet.",
    },
    {
      id: "eligibility",
      label: "Eligibility checked",
      status: getEligibilityCheckStatus(session),
      detail: getEligibilityDetail(session),
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
      id: "balance",
      label: getBalanceLabel(fundingRequirement?.tradeSide),
      status: funding?.balance ?? (balances?.usdcAvailable !== undefined ? "pass" : hasCredentials ? "fail" : "unknown"),
      detail: funding?.balanceDetail ?? getReadableBalanceDetail({ balances, hasCredentials }),
    },
    {
      id: "allowance",
      label: getAllowanceLabel(fundingRequirement?.tradeSide),
      status: funding?.allowance ?? (balances?.usdcAllowance !== undefined ? "pass" : hasCredentials ? "fail" : "unknown"),
      detail: funding?.allowanceDetail ?? getReadableAllowanceDetail({ balances, hasCredentials }),
    },
  ];
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

function getEligibilityCheckStatus(session: TradingUserSession | undefined): AccountReadinessCheck["status"] {
  if (!session) {
    return "fail";
  }

  if (session.eligibilityStatus === "eligible") {
    return "pass";
  }

  if (session.eligibilityStatus === "unknown") {
    return "unknown";
  }

  return "fail";
}

function getBalanceLabel(tradeSide: BidTradeSide | undefined) {
  if (tradeSide === "sell") {
    return "Token balance sufficient";
  }

  if (tradeSide === "buy") {
    return "USDC balance sufficient";
  }

  return "USDC balance readable";
}

function getAllowanceLabel(tradeSide: BidTradeSide | undefined) {
  if (tradeSide === "sell") {
    return "Token allowance sufficient";
  }

  if (tradeSide === "buy") {
    return "USDC allowance sufficient";
  }

  return "Allowance readable";
}

function getReadableBalanceDetail({
  balances,
  hasCredentials,
}: {
  balances?: UserBalanceSnapshot;
  hasCredentials: boolean;
}) {
  if (balances?.usdcAvailable !== undefined) {
    return formatBalanceSourceDetail({
      value: balances.usdcAvailable,
      label: "USDC available",
      clobValue: balances.clobUsdcAvailable,
      onchainValue: balances.onchainUsdcAvailable,
      source: balances.balanceSource,
    });
  }

  return balances?.error ?? (hasCredentials ? "USDC balance could not be read." : "Balance requires user CLOB credentials.");
}

function getReadableAllowanceDetail({
  balances,
  hasCredentials,
}: {
  balances?: UserBalanceSnapshot;
  hasCredentials: boolean;
}) {
  if (balances?.usdcAllowance !== undefined) {
    return formatBalanceSourceDetail({
      value: balances.usdcAllowance,
      label: "USDC allowance observed",
      clobValue: balances.clobUsdcAllowance,
      onchainValue: balances.onchainUsdcAllowance,
      source: balances.balanceSource,
    });
  }

  return balances?.error ?? (hasCredentials ? "Allowance could not be read." : "Allowance requires user CLOB credentials.");
}

function formatBalanceSourceDetail({
  value,
  label,
  clobValue,
  onchainValue,
  source,
}: {
  value: number;
  label: string;
  clobValue?: number;
  onchainValue?: number;
  source?: UserBalanceSnapshot["balanceSource"];
}) {
  const base = `${value.toFixed(2)} ${label}.`;

  if (source === "onchain") {
    return `${base} On-chain deposit wallet value is newer than the CLOB cache; sync may still be settling.`;
  }

  if (source === "mixed" && clobValue !== undefined && onchainValue !== undefined && clobValue !== onchainValue) {
    return `${base} CLOB cache: ${clobValue.toFixed(2)}; on-chain: ${onchainValue.toFixed(2)}.`;
  }

  return base;
}

function getEligibilityDetail(session: TradingUserSession | undefined): string {
  if (!session) {
    return "Connect a wallet before checking eligibility.";
  }

  const location = [session.eligibilityCountry, session.eligibilityRegion].filter(Boolean).join(" / ");
  const suffix = session.eligibilityCheckedAt ? ` Checked at ${session.eligibilityCheckedAt}.` : "";

  if (session.eligibilityStatus === "eligible") {
    return `${location || "Polymarket geoblock check passed."}${suffix}`;
  }

  if (session.eligibilityStatus === "blocked_region") {
    return `${session.eligibilityReason ?? "Polymarket reports this region is blocked."}${location ? ` ${location}.` : ""}${suffix}`;
  }

  if (session.eligibilityStatus === "error") {
    return `${session.eligibilityReason ?? "Polymarket geoblock check failed."}${suffix}`;
  }

  return `Eligibility is ${session.eligibilityStatus}.${suffix}`;
}
