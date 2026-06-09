import "server-only";

import type {
  TradingUserSession,
  UserTradingBalancesResponse,
} from "@/types/market";
import type { TradingSessionRecord } from "@/server/trading/session-store";
import {
  checkOrderFunding,
  fetchUserBalanceSnapshot,
  resolveOrderFundingRequirementWithFees,
  type OrderFundingRequirement,
} from "@/server/trading/balances";

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
  const balances = record.credentials
    ? await fetchUserBalanceSnapshot({
        session,
        credentials: record.credentials,
        tokenId,
      })
    : undefined;

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
