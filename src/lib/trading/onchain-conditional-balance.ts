import type { Address } from "viem";

import { POLYGON_CHAIN_ID } from "@/lib/market/polymarket-collateral-contracts";
import { getFundingPublicClient } from "@/lib/funding/funding-chain-client";
import { floorShares } from "@/lib/market/order-math";
import { getTradingContractAddresses } from "@/lib/trading/trading-contracts";

const CONDITIONAL_TOKEN_DECIMALS = 6;

const ERC1155_BALANCE_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "account", type: "address" },
      { name: "id", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export async function fetchOnchainConditionalTokenBalance(
  funderAddress: string,
  tokenId: string,
): Promise<number | undefined> {
  if (!/^0x[a-fA-F0-9]{40}$/.test(funderAddress) || !/^\d+$/.test(tokenId)) {
    return undefined;
  }

  try {
    const contracts = getTradingContractAddresses();
    const client = getFundingPublicClient(POLYGON_CHAIN_ID);
    const balance = await client.readContract({
      address: contracts.conditionalTokens as Address,
      abi: ERC1155_BALANCE_ABI,
      functionName: "balanceOf",
      args: [funderAddress as Address, BigInt(tokenId)],
    });

    return floorShares(Number(balance) / 10 ** CONDITIONAL_TOKEN_DECIMALS);
  } catch {
    return undefined;
  }
}
