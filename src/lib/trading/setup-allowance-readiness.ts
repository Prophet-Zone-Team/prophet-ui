import type { AccountReadinessCheck, UserTradingReadiness } from "@/types/market";

import type { OnchainCollateralSnapshot } from "@/lib/trading/onchain-collateral";
import { isTradingTokenAllowanceAuthorized } from "@/lib/trading/trading-allowance-setup";

export function getSetupAllowanceCheckStatusForSession({
  onchainAllowances,
  hasCredentials,
  session,
}: {
  onchainAllowances?: OnchainCollateralSnapshot["allowances"];
  hasCredentials: boolean;
  session?: UserTradingReadiness["session"];
}): AccountReadinessCheck["status"] {
  return getSetupAllowanceCheckStatus({ onchainAllowances, hasCredentials, session });
}

export function getReadableSetupAllowanceDetailForSession({
  onchainAllowances,
  hasCredentials,
  session,
}: {
  onchainAllowances?: OnchainCollateralSnapshot["allowances"];
  hasCredentials: boolean;
  session?: UserTradingReadiness["session"];
}) {
  return getReadableSetupAllowanceDetail({ onchainAllowances, hasCredentials, session });
}

export function applyOnchainAllowancesToSetupReadiness(
  readiness: UserTradingReadiness,
  snapshot: Pick<OnchainCollateralSnapshot, "allowances" | "updatedAt" | "error">,
): UserTradingReadiness {
  const onchainAllowances = snapshot.allowances;
  const hasCredentials = readiness.credentials.hasClobCredentials;
  const session = readiness.session;
  const allowanceStatus = getSetupAllowanceCheckStatus({
    onchainAllowances,
    hasCredentials,
    session,
  });
  const allowanceDetail = getReadableSetupAllowanceDetail({
    onchainAllowances,
    hasCredentials,
    session,
  });
  const checks = readiness.checks.map((check) =>
    check.id === "allowance"
      ? {
          ...check,
          status: allowanceStatus,
          detail: snapshot.error ?? allowanceDetail,
        }
      : check,
  );

  return {
    ...readiness,
    checks,
    ready: checks.every((check) => check.status === "pass"),
    updatedAt: snapshot.updatedAt ?? readiness.updatedAt,
  };
}

function getSetupAllowanceCheckStatus({
  onchainAllowances,
  hasCredentials,
  session,
}: {
  onchainAllowances?: OnchainCollateralSnapshot["allowances"];
  hasCredentials: boolean;
  session?: UserTradingReadiness["session"];
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
  session?: UserTradingReadiness["session"];
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
