import type { BidTradeSide } from "@/types/market";
import type {
  AccountReadinessCheck,
  UserBalanceSnapshot,
  UserTradingBalancesResponse,
  UserTradingReadiness,
} from "@/types/market";

function getBalanceLabel(tradeSide: BidTradeSide | undefined) {
  if (tradeSide === "sell") {
    return "Token balance";
  }

  return "USDC balance";
}

function getAllowanceLabel(tradeSide: BidTradeSide | undefined) {
  if (tradeSide === "sell") {
    return "Token allowance";
  }

  if (tradeSide === "buy") {
    return "USDC allowance";
  }

  return "USDC allowance";
}

function buildBalanceCheck({
  balances,
  funding,
  hasCredentials,
  tradeSide,
}: {
  balances?: UserBalanceSnapshot;
  funding?: UserTradingBalancesResponse["funding"];
  hasCredentials: boolean;
  tradeSide?: BidTradeSide;
}): AccountReadinessCheck {
  return {
    id: "balance",
    label: getBalanceLabel(tradeSide),
    status:
      funding?.balance ??
      (balances?.usdcAvailable !== undefined ? "pass" : hasCredentials ? "fail" : "unknown"),
    detail:
      funding?.balanceDetail ??
      (balances?.usdcAvailable !== undefined
        ? `${balances.usdcAvailable.toFixed(2)} USDC available.`
        : balances?.error ??
          (hasCredentials ? "USDC balance could not be read." : "Balance requires user CLOB credentials.")),
  };
}

function buildOrderAllowanceCheck(
  funding: NonNullable<UserTradingBalancesResponse["funding"]>,
  tradeSide?: BidTradeSide,
): AccountReadinessCheck {
  return {
    id: "allowance",
    label: getAllowanceLabel(tradeSide),
    status: funding.allowance,
    detail: funding.allowanceDetail,
  };
}

export function mergeTradingReadiness(
  setup: UserTradingReadiness,
  balancesResponse?: UserTradingBalancesResponse,
  options?: { tradeSide?: BidTradeSide },
): UserTradingReadiness {
  if (!balancesResponse?.balances && !balancesResponse?.funding) {
    return setup;
  }

  const { balances, funding } = balancesResponse;
  const hasCredentials = setup.credentials.hasClobCredentials;
  let checks = setup.checks.filter((check) => check.id !== "balance");

  if (funding) {
    checks = checks.filter((check) => check.id !== "allowance");
    checks.push(
      buildBalanceCheck({ balances, funding, hasCredentials, tradeSide: options?.tradeSide }),
      buildOrderAllowanceCheck(funding, options?.tradeSide),
    );
  } else if (balances) {
    checks.push(buildBalanceCheck({ balances, funding, hasCredentials, tradeSide: options?.tradeSide }));
  }

  const allPass = checks.every((check) => check.status === "pass");

  return {
    ...setup,
    balances,
    checks,
    ready: setup.ready && allPass,
    updatedAt: balancesResponse.updatedAt ?? setup.updatedAt,
  };
}

export function buildBalancesQuery(params: {
  tokenId?: string;
  tradeSide?: BidTradeSide;
  cost?: number;
  size?: number;
  totalCost?: number;
  estimatedTakerFee?: number;
}): string {
  const query = new URLSearchParams();

  if (params.tokenId) {
    query.set("tokenId", params.tokenId);
  }

  if (params.tradeSide) {
    query.set("tradeSide", params.tradeSide);
  }

  if (params.cost !== undefined) {
    query.set("cost", String(params.cost));
  }

  if (params.size !== undefined) {
    query.set("size", String(params.size));
  }

  if (params.totalCost !== undefined) {
    query.set("totalCost", String(params.totalCost));
  }

  if (params.estimatedTakerFee !== undefined) {
    query.set("estimatedTakerFee", String(params.estimatedTakerFee));
  }

  return query.toString();
}
