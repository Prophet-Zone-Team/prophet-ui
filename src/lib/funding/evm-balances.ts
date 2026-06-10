import Big from "big.js";
import { erc20Abi, type Address } from "viem";

import type { FundingToken } from "@/config/funding";
import { getFundingPublicClient } from "@/lib/funding/funding-chain-client";
import type { EvmBalancesByChain } from "@/types/funding";
import { removeNumberEndZero } from "@/utils/format";

export const NATIVE_FUNDING_TOKEN_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

export function isNativeFundingToken(address: string): boolean {
  return address.toLowerCase() === NATIVE_FUNDING_TOKEN_ADDRESS;
}

export function normalizeTokenAddress(address: string): string {
  return address.toLowerCase();
}

export function atomicBalanceToDecimal(balance: bigint, decimals: number): string {
  if (balance === 0n) {
    return "0";
  }

  return removeNumberEndZero(Big(balance.toString()).div(10 ** decimals).toFixed(decimals));
}

export async function fetchEvmTokenBalances(
  walletAddress: string,
  tokens: FundingToken[],
  options?: { signal?: AbortSignal },
): Promise<EvmBalancesByChain> {
  const owner = walletAddress as Address;
  const balances: EvmBalancesByChain = {};
  const tokensByChain = groupTokensByChainId(tokens);

  await Promise.allSettled(
    Object.entries(tokensByChain).map(async ([chainIdKey, chainTokens]) => {
      if (options?.signal?.aborted) {
        return;
      }

      const chainId = Number(chainIdKey);
      const chainBalances: Record<string, string> = {};

      try {
        const client = getFundingPublicClient(chainId);

        const erc20Tokens = chainTokens.filter((token) => !isNativeFundingToken(token.address));
        const nativeTokens = chainTokens.filter((token) => isNativeFundingToken(token.address));

        if (erc20Tokens.length > 0) {
          const results = await client.multicall({
            contracts: erc20Tokens.map((token) => ({
              address: token.address as Address,
              abi: erc20Abi,
              functionName: "balanceOf",
              args: [owner],
            })),
            allowFailure: true,
          });

          for (let index = 0; index < erc20Tokens.length; index += 1) {
            const token = erc20Tokens[index];
            const result = results[index];

            if (result.status === "success") {
              const rawBalance =
                typeof result.result === "bigint" ? result.result : BigInt(String(result.result));

              chainBalances[normalizeTokenAddress(token.address)] = atomicBalanceToDecimal(
                rawBalance,
                token.decimals,
              );
            } else {
              console.warn("[fetchEvmTokenBalances] ERC20 balance failed", {
                chainId,
                address: token.address,
                symbol: token.symbol,
              });
              chainBalances[normalizeTokenAddress(token.address)] = "0";
            }
          }
        }

        if (nativeTokens.length > 0) {
          try {
            const nativeBalance = await client.getBalance({ address: owner });
            const formatted = atomicBalanceToDecimal(nativeBalance, nativeTokens[0].decimals);

            for (const token of nativeTokens) {
              chainBalances[normalizeTokenAddress(token.address)] = formatted;
            }
          } catch (error) {
            console.warn("[fetchEvmTokenBalances] native balance failed", { chainId, error });

            for (const token of nativeTokens) {
              chainBalances[normalizeTokenAddress(token.address)] = "0";
            }
          }
        }
      } catch (error) {
        console.warn("[fetchEvmTokenBalances] chain fetch failed", { chainId, error });

        for (const token of chainTokens) {
          chainBalances[normalizeTokenAddress(token.address)] = "0";
        }
      }

      balances[chainIdKey] = chainBalances;
    }),
  );

  return balances;
}

function groupTokensByChainId(tokens: FundingToken[]): Record<string, FundingToken[]> {
  return tokens.reduce<Record<string, FundingToken[]>>((groups, token) => {
    const key = String(token.chainId);
    const current = groups[key] ?? [];
    current.push(token);
    groups[key] = current;
    return groups;
  }, {});
}
