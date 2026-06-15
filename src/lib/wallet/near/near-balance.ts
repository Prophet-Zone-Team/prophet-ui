import { providers } from "near-api-js";

import { FUNDING_NETWORKS } from "@/config/funding/networks";
import { atomicBalanceToDecimal } from "@/lib/funding/evm-balances";
import { viewFunction } from "@/lib/wallet/near/near-rpc";

export interface NearTokenBalanceKey {
  chainId: number;
  address: string;
}

export type NearBalancesByKey = Record<string, string>;

export function buildNearBalanceKey(token: NearTokenBalanceKey): string {
  return `${token.chainId}:${token.address.toLowerCase()}`;
}

export async function fetchNearFtBalance(
  contractId: string,
  accountId: string,
  decimals: number,
): Promise<string> {
  const balance = await viewFunction<string>({
    contractId,
    methodName: "ft_balance_of",
    args: {
      account_id: accountId,
    },
  });

  if (!balance || balance === "0") {
    return "0";
  }

  try {
    return atomicBalanceToDecimal(BigInt(balance), decimals);
  } catch {
    return "0";
  }
}

export async function fetchNearNativeBalance(accountId: string): Promise<string> {
  const provider = new providers.JsonRpcProvider({ url: FUNDING_NETWORKS.near.defaultRpcUrl });
  const account = await provider.query({
    request_type: "view_account",
    finality: "optimistic",
    account_id: accountId,
  });

  return (account as { amount?: string }).amount || "0";
}

export async function fetchNearTokenBalances(params: {
  accountId: string;
  tokens: Array<NearTokenBalanceKey & { contractId: string; decimals: number }>;
}): Promise<NearBalancesByKey> {
  const balances: NearBalancesByKey = {};

  await Promise.all(
    params.tokens.map(async (token) => {
      const key = buildNearBalanceKey(token);

      try {
        balances[key] = await fetchNearFtBalance(
          token.contractId,
          params.accountId,
          token.decimals,
        );
      } catch {
        balances[key] = "0";
      }
    }),
  );

  return balances;
}

export function isNearFundingToken(
  token: Pick<NearTokenBalanceKey, "chainId"> & { blockchain?: string },
): boolean {
  return (
    token.blockchain === "near" ||
    token.chainId === FUNDING_NETWORKS.near.chainId
  );
}
