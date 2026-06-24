import type { BidTradeSide, UserBalanceSnapshot } from "@/types/market";

import { getFundingSourceSuffix } from "@/lib/trading/collateral-balance-merge";
import { isTradeSkipSellBalanceCheckEnabled } from "@/lib/trading/trade-sell-test-mode";

export interface OrderFundingRequirement {
  tradeSide: BidTradeSide;
  cost: number;
  size: number;
  totalCost?: number;
  estimatedTakerFee?: number;
}

export interface OrderFundingCheck {
  balance: "pass" | "fail" | "unknown";
  allowance: "pass" | "fail" | "unknown";
  balanceDetail: string;
  allowanceDetail: string;
}

export function formatOrderFundingFailureMessage(
  funding: Pick<
    OrderFundingCheck,
    "balance" | "allowance" | "balanceDetail" | "allowanceDetail"
  >
): string {
  const parts: string[] = [];

  if (funding.balance === "fail" && funding.balanceDetail) {
    parts.push(funding.balanceDetail);
  }

  if (funding.allowance === "fail" && funding.allowanceDetail) {
    parts.push(funding.allowanceDetail);
  }

  return parts.join("\n");
}

export function checkOrderFunding({
  balances,
  requirement,
}: {
  balances?: UserBalanceSnapshot;
  requirement?: OrderFundingRequirement;
}): OrderFundingCheck | undefined {
  if (!requirement) {
    return undefined;
  }

  if (!balances || balances.error) {
    const detail = balances?.error ?? "Balance and allowance checks require user CLOB credentials.";

    return {
      balance: "unknown",
      allowance: "unknown",
      balanceDetail: detail,
      allowanceDetail: detail,
    };
  }

  if (requirement.tradeSide === "buy") {
    return checkBuyFunding({ balances, requiredUsdc: requirement.totalCost ?? requirement.cost });
  }

  return checkSellFunding({ balances, requiredShares: requirement.size });
}

export function parseOrderFundingRequirement(value: unknown): OrderFundingRequirement | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const input = value as {
    tradeSide?: unknown;
    cost?: unknown;
    size?: unknown;
    totalCost?: unknown;
    estimatedTakerFee?: unknown;
  };

  if (input.tradeSide !== "buy" && input.tradeSide !== "sell") {
    return undefined;
  }

  const cost = parsePositiveNumber(input.cost);
  const size = parsePositiveNumber(input.size);
  const totalCost = parsePositiveNumber(input.totalCost);
  const estimatedTakerFee = parsePositiveNumber(input.estimatedTakerFee);

  if (cost === undefined || size === undefined) {
    return undefined;
  }

  return {
    tradeSide: input.tradeSide,
    cost,
    size,
    totalCost,
    estimatedTakerFee,
  };
}

export function parseOrderFundingRequirementFromQuery(query: string): OrderFundingRequirement | undefined {
  const params = new URLSearchParams(query);

  return parseOrderFundingRequirement({
    tradeSide: params.get("tradeSide"),
    cost: parseQueryNumber(params.get("cost")),
    size: parseQueryNumber(params.get("size")),
    totalCost: parseQueryNumber(params.get("totalCost")),
    estimatedTakerFee: parseQueryNumber(params.get("estimatedTakerFee")),
  });
}

function checkBuyFunding({
  balances,
  requiredUsdc,
}: {
  balances: UserBalanceSnapshot;
  requiredUsdc: number;
}): OrderFundingCheck {
  return {
    balance: compareAvailable(balances.usdcAvailable, requiredUsdc),
    allowance: compareAvailable(balances.usdcAllowance, requiredUsdc),
    balanceDetail: formatFundingDetail({
      label: "USDC balance",
      available: balances.usdcAvailable,
      required: requiredUsdc,
      unit: "USDC",
      suffix: getFundingSourceSuffix(balances, "balance"),
    }),
    allowanceDetail: formatFundingDetail({
      label: "USDC allowance",
      available: balances.usdcAllowance,
      required: requiredUsdc,
      unit: "USDC",
      suffix: getFundingSourceSuffix(balances, "allowance"),
    }),
  };
}

function checkSellFunding({
  balances,
  requiredShares,
}: {
  balances: UserBalanceSnapshot;
  requiredShares: number;
}): OrderFundingCheck {
  if (isTradeSkipSellBalanceCheckEnabled()) {
    return {
      balance: "pass",
      allowance: "pass",
      balanceDetail: "Sell balance check skipped (test mode).",
      allowanceDetail:
        "Outcome token spending was authorized during account setup.",
    };
  }

  return {
    balance: compareAvailable(balances.conditionalTokenBalance, requiredShares),
    // Sell relies on one-time setup approvals from login; only share balance gates the order.
    allowance: "pass",
    balanceDetail: formatFundingDetail({
      label: "Conditional token balance",
      available: balances.conditionalTokenBalance,
      required: requiredShares,
      unit: "shares",
    }),
    allowanceDetail:
      "Outcome token spending was authorized during account setup.",
  };
}

function compareAvailable(available: number | undefined, required: number): "pass" | "fail" | "unknown" {
  if (available === undefined) {
    return "unknown";
  }

  return available >= required ? "pass" : "fail";
}

function formatFundingDetail({
  label,
  available,
  required,
  unit,
  suffix,
}: {
  label: string;
  available?: number;
  required: number;
  unit: string;
  suffix?: string;
}) {
  if (available === undefined) {
    return `${label} is not available. Required: ${formatAmount(required)} ${unit}.`;
  }

  return `${label}: ${formatAmount(available)} ${unit} available; ${formatAmount(required)} ${unit} required.${suffix ? ` ${suffix}` : ""}`;
}

function parsePositiveNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }

  return value;
}

function parseQueryNumber(value: string | null) {
  if (value === null) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 4,
  }).format(value);
}
