import "server-only";

import type {
  TradingUserSession,
  UserBalanceSnapshot,
  UserTradingBalancesResponse,
} from "@/types/market";
import type { TradingSessionRecord } from "@/server/trading/session-store";
import {
  checkOrderFunding,
  fetchUserBalanceSnapshot,
  resolveOrderFundingRequirementWithFees,
  type OrderFundingRequirement,
} from "@/server/trading/balances";
import {
  fetchOnchainCollateralSnapshot,
  type OnchainCollateralSnapshot,
} from "@/server/trading/onchain-balances";

export async function buildUserTradingBalances({
  record,
  tokenId,
  fundingRequirement,
}: {
  record?: TradingSessionRecord;
  tokenId?: string;
  fundingRequirement?: OrderFundingRequirement;
}): Promise<UserTradingBalancesResponse> {
  if (!record) {
    return {
      updatedAt: new Date().toISOString(),
    };
  }

  const session = record.session;
  const onchainSnapshot = await fetchOnchainSnapshotForBalances(session);
  const balances = record.credentials
    ? await fetchUserBalanceSnapshot({
        session,
        credentials: record.credentials,
        tokenId,
      })
    : toOnchainBalanceSnapshot(session, onchainSnapshot);

  const resolvedFundingRequirement =
    fundingRequirement && tokenId
      ? await resolveOrderFundingRequirementWithFees(fundingRequirement, tokenId)
      : fundingRequirement;

  const funding = checkOrderFunding({
    balances,
    requirement: resolvedFundingRequirement,
  });

  return {
    balances,
    funding: funding
      ? {
          balance: funding.balance,
          allowance: funding.allowance,
          balanceDetail: funding.balanceDetail,
          allowanceDetail: funding.allowanceDetail,
        }
      : undefined,
    updatedAt: new Date().toISOString(),
  };
}

async function fetchOnchainSnapshotForBalances(session: TradingUserSession | undefined) {
  if (session?.depositWalletStatus !== "deployed" || !session.funderAddress) {
    return undefined;
  }

  return fetchOnchainCollateralSnapshot(session.funderAddress);
}

function toOnchainBalanceSnapshot(
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
