import type { TradingUserSession, UserBalanceSnapshot } from "@/types/market";

import type { OnchainCollateralSnapshot } from "@/lib/trading/onchain-collateral";

export function toOnchainBalanceSnapshot(
  session: TradingUserSession | undefined,
  onchainSnapshot: OnchainCollateralSnapshot | undefined,
): UserBalanceSnapshot | undefined {
  if (!session || !onchainSnapshot || onchainSnapshot.error) {
    return onchainSnapshot?.error
      ? {
          walletAddress: session?.walletAddress ?? "",
          funderAddress: session?.funderAddress,
          updatedAt: onchainSnapshot.updatedAt,
          error: onchainSnapshot.error,
        }
      : undefined;
  }

  return {
    walletAddress: session.walletAddress,
    funderAddress: session.funderAddress,
    usdcAvailable: onchainSnapshot.usdcAvailable,
    usdcAllowance: onchainSnapshot.usdcAllowance,
    onchainUsdcAvailable: onchainSnapshot.usdcAvailable,
    onchainUsdcAllowance: onchainSnapshot.usdcAllowance,
    balanceSource: "onchain",
    updatedAt: onchainSnapshot.updatedAt,
  };
}

export function mergeCollateralSnapshots(
  clobSnapshot: UserBalanceSnapshot,
  onchainSnapshot: {
    usdcAvailable?: number;
    usdcAllowance?: number;
    updatedAt: string;
  },
): UserBalanceSnapshot {
  const usdcAvailable = maxDefined(clobSnapshot.usdcAvailable, onchainSnapshot.usdcAvailable);
  const usdcAllowance = maxDefined(clobSnapshot.usdcAllowance, onchainSnapshot.usdcAllowance);

  return {
    ...clobSnapshot,
    clobUsdcAvailable: clobSnapshot.usdcAvailable,
    clobUsdcAllowance: clobSnapshot.usdcAllowance,
    onchainUsdcAvailable: onchainSnapshot.usdcAvailable,
    onchainUsdcAllowance: onchainSnapshot.usdcAllowance,
    usdcAvailable,
    usdcAllowance,
    balanceSource: getBalanceSource({
      clobAvailable: clobSnapshot.usdcAvailable,
      clobAllowance: clobSnapshot.usdcAllowance,
      onchainAvailable: onchainSnapshot.usdcAvailable,
      onchainAllowance: onchainSnapshot.usdcAllowance,
      mergedAvailable: usdcAvailable,
      mergedAllowance: usdcAllowance,
    }),
    updatedAt: new Date().toISOString(),
  };
}

export function getFundingSourceSuffix(balances: UserBalanceSnapshot, kind: "balance" | "allowance") {
  if (balances.balanceSource !== "onchain") {
    return undefined;
  }

  const clobValue = kind === "balance" ? balances.clobUsdcAvailable : balances.clobUsdcAllowance;
  const onchainValue = kind === "balance" ? balances.onchainUsdcAvailable : balances.onchainUsdcAllowance;

  if (onchainValue === undefined || clobValue === undefined || onchainValue <= clobValue) {
    return "On-chain and CLOB cache are being reconciled.";
  }

  return `On-chain deposit wallet shows ${formatAmount(onchainValue)} USDC; CLOB cache shows ${formatAmount(clobValue)} USDC.`;
}

function maxDefined(left: number | undefined, right: number | undefined): number | undefined {
  if (left === undefined) {
    return right;
  }

  if (right === undefined) {
    return left;
  }

  return Math.max(left, right);
}

function getBalanceSource({
  clobAvailable,
  clobAllowance,
  onchainAvailable,
  onchainAllowance,
  mergedAvailable,
  mergedAllowance,
}: {
  clobAvailable?: number;
  clobAllowance?: number;
  onchainAvailable?: number;
  onchainAllowance?: number;
  mergedAvailable?: number;
  mergedAllowance?: number;
}): UserBalanceSnapshot["balanceSource"] {
  const balanceSource = getValueSource(clobAvailable, onchainAvailable, mergedAvailable);
  const allowanceSource = getValueSource(clobAllowance, onchainAllowance, mergedAllowance);

  if (balanceSource === "both" && allowanceSource === "both") {
    return "mixed";
  }

  if (
    (balanceSource === "onchain" || balanceSource === "both") &&
    (allowanceSource === "onchain" || allowanceSource === "both")
  ) {
    return "onchain";
  }

  if (balanceSource !== allowanceSource) {
    return "mixed";
  }

  return "clob";
}

function getValueSource(
  clobValue: number | undefined,
  onchainValue: number | undefined,
  mergedValue: number | undefined,
): "clob" | "onchain" | "both" {
  if (mergedValue === undefined || clobValue === onchainValue) {
    return "both";
  }

  return onchainValue === mergedValue ? "onchain" : "clob";
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 4,
  }).format(value);
}
