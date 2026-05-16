import { encodeFunctionData, maxUint256 } from "viem";
import type { Hex, TypedDataDomain, TypedDataParameter } from "viem";

export interface DepositWalletCall {
  target: string;
  value: string;
  data: Hex;
}

export interface DepositWalletBatchSignablePayload {
  walletAddress: string;
  nonce: string;
  deadline: string;
  calls: DepositWalletCall[];
  domain: TypedDataDomain;
  types: Record<string, TypedDataParameter[]>;
  primaryType: "Batch";
  message: {
    wallet: string;
    nonce: string;
    deadline: string;
    calls: DepositWalletCall[];
  };
}

const DEPOSIT_WALLET_DOMAIN_NAME = "DepositWallet";
const DEPOSIT_WALLET_DOMAIN_VERSION = "1";
const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;
const ERC1155_ABI = [
  {
    name: "setApprovalForAll",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "operator", type: "address" },
      { name: "approved", type: "bool" },
    ],
    outputs: [],
  },
] as const;

export function buildTradingApprovalBatch({
  chainId,
  walletAddress,
  nonce,
  deadline,
  collateralToken,
  conditionalTokens,
  exchange,
  negRiskExchange,
}: {
  chainId: number;
  walletAddress: string;
  nonce: string;
  deadline: string;
  collateralToken: string;
  conditionalTokens: string;
  exchange: string;
  negRiskExchange: string;
}): DepositWalletBatchSignablePayload {
  const calls = [
    createErc20ApproveCall({
      tokenAddress: collateralToken,
      spenderAddress: conditionalTokens,
    }),
    createErc20ApproveCall({
      tokenAddress: collateralToken,
      spenderAddress: exchange,
    }),
    createErc20ApproveCall({
      tokenAddress: collateralToken,
      spenderAddress: negRiskExchange,
    }),
    createErc1155ApprovalCall({
      tokenAddress: conditionalTokens,
      operatorAddress: exchange,
    }),
    createErc1155ApprovalCall({
      tokenAddress: conditionalTokens,
      operatorAddress: negRiskExchange,
    }),
  ];

  return {
    walletAddress,
    nonce,
    deadline,
    calls,
    domain: {
      name: DEPOSIT_WALLET_DOMAIN_NAME,
      version: DEPOSIT_WALLET_DOMAIN_VERSION,
      chainId,
      verifyingContract: walletAddress as `0x${string}`,
    },
    types: {
      Batch: [
        { name: "wallet", type: "address" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
        { name: "calls", type: "Call[]" },
      ],
      Call: [
        { name: "target", type: "address" },
        { name: "value", type: "uint256" },
        { name: "data", type: "bytes" },
      ],
    },
    primaryType: "Batch",
    message: {
      wallet: walletAddress,
      nonce,
      deadline,
      calls,
    },
  };
}

function createErc20ApproveCall({
  tokenAddress,
  spenderAddress,
}: {
  tokenAddress: string;
  spenderAddress: string;
}): DepositWalletCall {
  return {
    target: tokenAddress,
    value: "0",
    data: encodeFunctionData({
      abi: ERC20_ABI,
      functionName: "approve",
      args: [spenderAddress as `0x${string}`, maxUint256],
    }),
  };
}

function createErc1155ApprovalCall({
  tokenAddress,
  operatorAddress,
}: {
  tokenAddress: string;
  operatorAddress: string;
}): DepositWalletCall {
  return {
    target: tokenAddress,
    value: "0",
    data: encodeFunctionData({
      abi: ERC1155_ABI,
      functionName: "setApprovalForAll",
      args: [operatorAddress as `0x${string}`, true],
    }),
  };
}
