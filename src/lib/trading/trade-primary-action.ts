import { showOrderErrorToast } from "@/lib/trading/order-toast";
import {
  eligibilityViewFromSession,
  formatEligibilityRestrictionDetail,
  formatRegionBlockedDetail,
} from "@/lib/trading/trading-eligibility-client";
import { postCollateralBalanceSync } from "@/lib/trading/sync-collateral-balance";
import {
  getTradingSetupSteps,
  isSetupStepComplete,
} from "@/lib/trading/trading-setup";
import type {
  AccountReadinessCheck,
  BidTradeSide,
  TradingUserSession,
  UserTradingReadiness,
} from "@/types/market";

export type TradePrimaryActionKind =
  | "submit"
  | "connect"
  | "deploy_wallet"
  | "sign_clob"
  | "authorize_tokens"
  | "deposit"
  | "sync_allowance"
  | "market_blocked"
  | "eligibility_blocked"
  | "retry_eligibility";

export interface TradePrimaryAction {
  kind: TradePrimaryActionKind;
  label: string;
  hint?: string;
}

export interface ResolveTradePrimaryActionInput {
  isAuthenticated: boolean;
  session?: TradingUserSession;
  orderReadiness?: UserTradingReadiness;
  authReadiness?: UserTradingReadiness;
  tradeSide: BidTradeSide;
  submitLabel: string;
  previewCanSubmit: boolean;
  previewDisabledReason?: string;
  expirationError?: string;
  isBuyRestricted?: boolean;
  isRegionFullyBlocked?: boolean;
  isRegionCloseOnly?: boolean;
  eligibilityNetworkError?: boolean;
}

export const INSUFFICIENT_FUNDS_TOAST_MESSAGE = "Insufficient funds";

export interface RunTradePrimaryActionDeps {
  tokenId?: string;
  openLogin: () => Promise<unknown>;
  signClobCredentials: () => Promise<void>;
  signTokenApprovals: () => Promise<void>;
  refreshOrderReadiness?: () => Promise<unknown>;
  refreshSetupReadiness?: () => Promise<UserTradingReadiness | undefined>;
  onRetryEligibility?: () => Promise<void>;
}

export function getReadinessCheck(
  readiness: UserTradingReadiness | undefined,
  id: AccountReadinessCheck["id"],
): AccountReadinessCheck | undefined {
  return readiness?.checks.find((check) => check.id === id);
}

export function isSetupAllowanceFailureDetail(detail: string | undefined): boolean {
  if (!detail) {
    return false;
  }

  const normalized = detail.toLowerCase();

  return (
    normalized.includes("missing on-chain") ||
    normalized.includes("not approved yet")
  );
}

export function isOrderFundingAllowanceFailure(
  check: AccountReadinessCheck | undefined,
): boolean {
  if (!check || check.status !== "fail") {
    return false;
  }

  if (isSetupAllowanceFailureDetail(check.detail)) {
    return false;
  }

  return /available/i.test(check.detail) && /required/i.test(check.detail);
}

function isBuyBalanceInsufficient(input: {
  tradeSide: BidTradeSide;
  readiness: UserTradingReadiness | undefined;
}): boolean {
  if (input.tradeSide !== "buy") {
    return false;
  }

  const balanceCheck = getReadinessCheck(input.readiness, "balance");

  return balanceCheck?.status === "fail";
}

function isAllowanceInsufficient(
  readiness: UserTradingReadiness | undefined,
): boolean {
  const allowanceCheck = getReadinessCheck(readiness, "allowance");

  return allowanceCheck?.status === "fail";
}

function needsAuthorizeTokens(
  readiness: UserTradingReadiness | undefined,
  authReadiness?: UserTradingReadiness,
): boolean {
  const allowanceCheck = getReadinessCheck(readiness, "allowance");
  const setupReadiness = authReadiness ?? readiness;

  if (allowanceCheck?.status === "pass") {
    return false;
  }

  if (allowanceCheck?.status === "fail") {
    return (
      isSetupAllowanceFailureDetail(allowanceCheck.detail) ||
      !isOrderFundingAllowanceFailure(allowanceCheck)
    );
  }

  if (allowanceCheck?.status === "unknown") {
    if (allowanceCheck.label === "Allowance") {
      return !getTradingSetupSteps(setupReadiness).tokensAuthorized;
    }

    return false;
  }

  return !getTradingSetupSteps(setupReadiness).tokensAuthorized;
}

export function resolveTradePrimaryAction(
  input: ResolveTradePrimaryActionInput,
): TradePrimaryAction {
  if (input.expirationError) {
    return {
      kind: "market_blocked",
      label: input.submitLabel,
      hint: input.expirationError,
    };
  }

  if (!input.previewCanSubmit) {
    return {
      kind: "market_blocked",
      label: input.submitLabel,
      hint:
        input.previewDisabledReason ??
        "This market is not available for real orders.",
    };
  }

  if (!input.isAuthenticated || !input.session) {
    return {
      kind: "connect",
      label: "Enable trading",
      hint: "Connect your wallet to continue.",
    };
  }

  const isEligibilityBlocked =
    input.tradeSide === "buy"
      ? Boolean(input.isBuyRestricted)
      : Boolean(input.isRegionFullyBlocked);

  if (isEligibilityBlocked) {
    const eligibilityView = eligibilityViewFromSession(input.session);

    return {
      kind: "eligibility_blocked",
      label: input.submitLabel,
      hint:
        input.tradeSide === "buy"
          ? formatEligibilityRestrictionDetail(eligibilityView)
          : formatRegionBlockedDetail(eligibilityView),
    };
  }

  if (input.eligibilityNetworkError) {
    return {
      kind: "retry_eligibility",
      label: "Retry eligibility",
      hint:
        input.session.eligibilityReason ??
        "Polymarket geoblock check timed out or is unreachable.",
    };
  }

  const readiness = input.orderReadiness ?? input.authReadiness;
  const setupSteps = getTradingSetupSteps(input.authReadiness ?? readiness);

  if (!setupSteps.walletDeployed) {
    return {
      kind: "deploy_wallet",
      label: "Prepare account",
      hint: "Deploy your Polymarket deposit wallet to continue.",
    };
  }

  if (!setupSteps.clobSigned) {
    return {
      kind: "sign_clob",
      label: "Enable trading",
      hint:
        "Sign once to derive your user-specific Polymarket CLOB credentials.",
    };
  }

  if (needsAuthorizeTokens(readiness, input.authReadiness)) {
    const allowanceCheck = getReadinessCheck(readiness, "allowance");

    return {
      kind: "authorize_tokens",
      label: "Authorize tokens",
      hint:
        allowanceCheck?.detail ??
        "Authorize token spending before placing orders.",
    };
  }

  if (isBuyBalanceInsufficient({ tradeSide: input.tradeSide, readiness })) {
    const balanceCheck = getReadinessCheck(readiness, "balance");

    return {
      kind: "deposit",
      label: "Add funds",
      hint:
        balanceCheck?.detail ??
        "Insufficient USDC balance for this order. Deposit funds to continue.",
    };
  }

  if (isAllowanceInsufficient(readiness)) {
    const allowanceCheck = getReadinessCheck(readiness, "allowance");

    return {
      kind: "sync_allowance",
      label: "Refresh allowance",
      hint:
        allowanceCheck?.detail ??
        "Refresh your trading allowance, then submit your order again.",
    };
  }

  if (readiness && !readiness.ready) {
    const blocking = readiness.checks.find((check) => check.status !== "pass");

    if (blocking) {
      if (
        input.tradeSide === "buy" &&
        blocking.status === "unknown" &&
        (blocking.id === "allowance" || blocking.id === "balance")
      ) {
        return {
          kind: "sync_allowance",
          label: "Refresh allowance",
          hint:
            blocking.detail ??
            "Refresh your trading balance and allowance, then submit your order again.",
        };
      }

      return {
        kind: "market_blocked",
        label: input.submitLabel,
        hint: `${blocking.label}: ${blocking.detail}`,
      };
    }
  }

  return {
    kind: "submit",
    label: input.submitLabel,
  };
}

export async function runTradePrimaryAction(
  action: TradePrimaryAction,
  deps: RunTradePrimaryActionDeps,
): Promise<boolean> {
  switch (action.kind) {
    case "submit":
      return false;
    case "connect":
    case "deploy_wallet":
      await deps.openLogin();
      return true;
    case "sign_clob":
      await deps.signClobCredentials();
      await deps.refreshSetupReadiness?.();
      return true;
    case "authorize_tokens":
      await deps.signTokenApprovals();
      await deps.refreshOrderReadiness?.();
      await deps.refreshSetupReadiness?.();
      return true;
    case "deposit":
      showOrderErrorToast(
        action.hint ?? INSUFFICIENT_FUNDS_TOAST_MESSAGE,
      );
      return true;
    case "sync_allowance":
      await postCollateralBalanceSync(deps.tokenId);
      await deps.refreshOrderReadiness?.();
      await deps.refreshSetupReadiness?.();
      return true;
    case "retry_eligibility":
      await deps.onRetryEligibility?.();
      return true;
    case "market_blocked":
    case "eligibility_blocked":
      return true;
    default:
      return false;
  }
}

export function isTradingSetupReadyForOrder(
  readiness: UserTradingReadiness | undefined,
): boolean {
  return (
    isSetupStepComplete(readiness, "wallet") &&
    isSetupStepComplete(readiness, "clob") &&
    isSetupStepComplete(readiness, "tokens")
  );
}
