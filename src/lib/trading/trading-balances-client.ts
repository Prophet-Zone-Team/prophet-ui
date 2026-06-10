import { fetchJson } from "@/lib/team/client-fetch";
import {
  mergeCollateralSnapshots,
  toOnchainBalanceSnapshot,
} from "@/lib/trading/collateral-balance-merge";
import { fetchOnchainCollateralSnapshot } from "@/lib/trading/onchain-collateral";
import {
  checkOrderFunding,
  parseOrderFundingRequirementFromQuery,
  type OrderFundingRequirement,
} from "@/lib/trading/order-funding-check";
import { applyOnchainAllowancesToSetupReadiness } from "@/lib/trading/setup-allowance-readiness";
import type {
  TradingUserSession,
  UserTradingBalancesResponse,
  UserTradingReadiness,
} from "@/types/market";

function shouldFetchOnchainCollateral(session: TradingUserSession | undefined) {
  return session?.depositWalletStatus === "deployed" && Boolean(session.funderAddress);
}

export async function enrichTradingBalancesResponse(
  session: TradingUserSession | undefined,
  response: UserTradingBalancesResponse,
  fundingRequirement?: OrderFundingRequirement,
): Promise<UserTradingBalancesResponse> {
  if (!shouldFetchOnchainCollateral(session)) {
    return response;
  }

  const onchainSnapshot = await fetchOnchainCollateralSnapshot(session!.funderAddress!);
  let balances = response.balances;

  if (!balances) {
    balances = toOnchainBalanceSnapshot(session, onchainSnapshot);
  } else if (session?.signatureType === 3 && !onchainSnapshot.error) {
    balances = mergeCollateralSnapshots(balances, onchainSnapshot);
  }

  const funding =
    fundingRequirement && balances
      ? checkOrderFunding({ balances, requirement: fundingRequirement })
      : response.funding;

  return {
    ...response,
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

export async function enrichSetupReadinessWithOnchain(
  readiness: UserTradingReadiness,
): Promise<UserTradingReadiness> {
  const session = readiness.session;

  if (!shouldFetchOnchainCollateral(session)) {
    return readiness;
  }

  const snapshot = await fetchOnchainCollateralSnapshot(session!.funderAddress!);

  return applyOnchainAllowancesToSetupReadiness(readiness, snapshot);
}

export async function fetchTradingBalancesWithOnchain(
  session: TradingUserSession | undefined,
  path = "/api/trading/balances",
  options?: { fundingRequirement?: OrderFundingRequirement; fundingQuery?: string },
): Promise<UserTradingBalancesResponse> {
  const response = await fetchJson<UserTradingBalancesResponse>(path);
  const fundingRequirement =
    options?.fundingRequirement ??
    (options?.fundingQuery ? parseOrderFundingRequirementFromQuery(options.fundingQuery) : undefined);

  return enrichTradingBalancesResponse(session, response, fundingRequirement);
}

export async function fetchTradingReadinessWithOnchain(
  path = "/api/trading/readiness",
): Promise<UserTradingReadiness> {
  const readiness = await fetchJson<UserTradingReadiness>(path);

  return enrichSetupReadinessWithOnchain(readiness);
}
