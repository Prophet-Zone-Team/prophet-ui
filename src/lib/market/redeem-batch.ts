import { encodeFunctionData, getAddress, zeroHash, type Hex } from "viem";

import { POLYGON_COLLATERAL_CONTRACTS } from "@/lib/market/polymarket-collateral-contracts";
import {
  buildDepositWalletBatchPayload,
  createErc1155ApprovalCall,
  type DepositWalletBatchSignablePayload,
  type DepositWalletCall,
} from "@/lib/market/deposit-wallet-batch";

const REDEEM_INDEX_SETS = [1n, 2n] as const;

const CTF_REDEEM_ABI = [
  {
    name: "redeemPositions",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "collateralToken", type: "address" },
      { name: "parentCollectionId", type: "bytes32" },
      { name: "conditionId", type: "bytes32" },
      { name: "indexSets", type: "uint256[]" },
    ],
    outputs: [],
  },
] as const;

export function resolveRedeemAdapterAddress(negativeRisk: boolean): string {
  return negativeRisk
    ? POLYGON_COLLATERAL_CONTRACTS.negRiskCtfCollateralAdapter
    : POLYGON_COLLATERAL_CONTRACTS.ctfCollateralAdapter;
}

export function createRedeemPositionsCall({
  adapterAddress,
  collateralToken,
  conditionId,
}: {
  adapterAddress: string;
  collateralToken: string;
  conditionId: string;
}): DepositWalletCall {
  return {
    target: adapterAddress,
    value: "0",
    data: encodeFunctionData({
      abi: CTF_REDEEM_ABI,
      functionName: "redeemPositions",
      args: [
        getAddress(collateralToken),
        zeroHash,
        conditionId as Hex,
        [...REDEEM_INDEX_SETS],
      ],
    }),
  };
}

export function buildRedeemBatch({
  chainId,
  walletAddress,
  nonce,
  deadline,
  conditionId,
  negativeRisk,
  collateralToken,
  conditionalTokens,
  ctfCollateralAdapter = POLYGON_COLLATERAL_CONTRACTS.ctfCollateralAdapter,
  negRiskCtfCollateralAdapter = POLYGON_COLLATERAL_CONTRACTS.negRiskCtfCollateralAdapter,
  includeAdapterApproval = true,
}: {
  chainId: number;
  walletAddress: string;
  nonce: string;
  deadline: string;
  conditionId: string;
  negativeRisk: boolean;
  collateralToken: string;
  conditionalTokens: string;
  ctfCollateralAdapter?: string;
  negRiskCtfCollateralAdapter?: string;
  includeAdapterApproval?: boolean;
}): DepositWalletBatchSignablePayload {
  const adapterAddress = resolveRedeemAdapterAddress(negativeRisk);
  const calls: DepositWalletCall[] = [];

  if (includeAdapterApproval) {
    calls.push(
      createErc1155ApprovalCall({
        tokenAddress: conditionalTokens,
        operatorAddress: adapterAddress,
      }),
    );
  }

  calls.push(
    createRedeemPositionsCall({
      adapterAddress,
      collateralToken,
      conditionId,
    }),
  );

  return buildDepositWalletBatchPayload({
    chainId,
    walletAddress,
    nonce,
    deadline,
    calls,
  });
}
