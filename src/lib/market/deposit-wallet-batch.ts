import { encodeFunctionData, getAddress, maxUint256 } from "viem";
import type { Hex, TypedDataDomain, TypedDataParameter } from "viem";

import {
  POLYGON_CHAIN_ID,
  POLYGON_COLLATERAL_CONTRACTS,
  QUOTE_ID_PATTERN,
} from "@/lib/market/polymarket-collateral-contracts";

export interface DepositWalletCall {
  target: string;
  value: string;
  data: Hex;
}

export interface DepositWalletBatchSignablePayload {
  domain: TypedDataDomain;
  message: {
    wallet: string;
    nonce: string;
    deadline: string;
    calls: DepositWalletCall[];
  };
  primaryType: "Batch";
  types: Record<string, TypedDataParameter[]>;
}

// export type WithdrawBatchStrategy =
//   | { kind: "pusd_transfer"; bridgeRecipient: string }
//   | {
//       kind: "same_chain_unwrap_deposit";
//       unwrapAsset: string;
//       bridgeRouter: string;
//       depositId: `0x${string}`;
//     };
export type WithdrawBatchStrategy = {
  unwrapAsset: string;
  bridgeRouter: string;
  depositId: `0x${string}`;
};

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
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;
const COLLATERAL_OFFRAMP_ABI = [
  {
    name: "unwrap",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_asset", type: "address" },
      { name: "_to", type: "address" },
      { name: "_amount", type: "uint256" },
    ],
    outputs: [],
  },
] as const;
const BRIDGE_ROUTER_ABI = [
  {
    name: "depositErc20",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "id", type: "bytes32" },
    ],
    outputs: [],
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
const DEPOSIT_WALLET_SESSION_ABI = [
  {
    name: "authorizeSessionSigner",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "sessionSigner", type: "address" },
      { name: "validUntil", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

export function isPusdTokenAddress(tokenAddress: string): boolean {
  return tokenAddress.toLowerCase() === POLYGON_COLLATERAL_CONTRACTS.pUsd.toLowerCase();
}

export function requiresWithdrawQuoteId({
  tradingChainId,
  toChainId,
  toTokenAddress,
}: {
  tradingChainId: number;
  toChainId: string;
  toTokenAddress: string;
}): boolean {
  const destinationChainId = Number(toChainId);

  if (!Number.isFinite(destinationChainId) || destinationChainId !== tradingChainId) {
    return false;
  }

  return !isPusdTokenAddress(toTokenAddress);
}

export function resolveWithdrawBatchStrategy({
  tradingChainId,
  toChainId,
  toTokenAddress,
  bridgeRecipient,
  quoteId,
}: {
  tradingChainId: number;
  toChainId: string;
  toTokenAddress: string;
  bridgeRecipient: string;
  quoteId?: string;
}): WithdrawBatchStrategy {
  const destinationChainId = Number(toChainId);

  if (!Number.isFinite(destinationChainId)) {
    throw new Error("toChainId must be a numeric chain id.");
  }

  const useSameChainUnwrap =
    destinationChainId === tradingChainId &&
    tradingChainId === POLYGON_CHAIN_ID &&
    !isPusdTokenAddress(toTokenAddress);

  // if (useSameChainUnwrap) {
  if (!quoteId || !QUOTE_ID_PATTERN.test(quoteId)) {
    throw new Error("A valid bridge quoteId is required for this withdrawal.");
  }

  return {
    // kind: "same_chain_unwrap_deposit",
    unwrapAsset: POLYGON_COLLATERAL_CONTRACTS.usdcE,
    bridgeRouter: POLYGON_COLLATERAL_CONTRACTS.bridgeRouter,
    depositId: quoteId as `0x${string}`,
  };
  // }

  // return {
  //   kind: "pusd_transfer",
  //   bridgeRecipient,
  // };
}

export function buildTradingApprovalBatch({
  chainId,
  walletAddress,
  nonce,
  deadline,
  collateralToken,
  conditionalTokens,
  exchange,
  negRiskExchange,
  sessionSignerAddress,
  sessionSignerValidUntil,
}: {
  chainId: number;
  walletAddress: string;
  nonce: string;
  deadline: string;
  collateralToken: string;
  conditionalTokens: string;
  exchange: string;
  negRiskExchange: string;
  sessionSignerAddress?: string;
  sessionSignerValidUntil?: string;
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

  if (sessionSignerAddress && sessionSignerValidUntil) {
    calls.push(
      createAuthorizeSessionSignerCall({
        walletAddress,
        sessionSignerAddress,
        validUntil: sessionSignerValidUntil,
      }),
    );
  }

  return buildDepositWalletBatchPayload({
    chainId,
    walletAddress,
    nonce,
    deadline,
    calls,
  });
}

function createAuthorizeSessionSignerCall({
  walletAddress,
  sessionSignerAddress,
  validUntil,
}: {
  walletAddress: string;
  sessionSignerAddress: string;
  validUntil: string;
}): DepositWalletCall {
  return {
    target: walletAddress,
    value: "0",
    data: encodeFunctionData({
      abi: DEPOSIT_WALLET_SESSION_ABI,
      functionName: "authorizeSessionSigner",
      args: [sessionSignerAddress as `0x${string}`, BigInt(validUntil)],
    }),
  };
}

export function createErc20TransferCall({
  tokenAddress,
  recipientAddress,
  amountBaseUnits,
}: {
  tokenAddress: string;
  recipientAddress: string;
  amountBaseUnits: bigint;
}): DepositWalletCall {
  return {
    target: tokenAddress,
    value: "0",
    data: encodeFunctionData({
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [getAddress(recipientAddress), amountBaseUnits],
    }),
  };
}

export function createErc20ApproveExactCall({
  tokenAddress,
  spenderAddress,
  amountBaseUnits,
}: {
  tokenAddress: string;
  spenderAddress: string;
  amountBaseUnits: bigint;
}): DepositWalletCall {
  return {
    target: tokenAddress,
    value: "0",
    data: encodeFunctionData({
      abi: ERC20_ABI,
      functionName: "approve",
      args: [spenderAddress as `0x${string}`, amountBaseUnits],
    }),
  };
}

export function createCollateralOfframpUnwrapCall({
  offrampAddress,
  assetAddress,
  recipientAddress,
  amountBaseUnits,
}: {
  offrampAddress: string;
  assetAddress: string;
  recipientAddress: string;
  amountBaseUnits: bigint;
}): DepositWalletCall {
  return {
    target: offrampAddress,
    value: "0",
    data: encodeFunctionData({
      abi: COLLATERAL_OFFRAMP_ABI,
      functionName: "unwrap",
      args: [assetAddress as `0x${string}`, recipientAddress as `0x${string}`, amountBaseUnits],
    }),
  };
}

export function createBridgeDepositErc20Call({
  routerAddress,
  fromAddress,
  tokenAddress,
  amountBaseUnits,
  depositId,
}: {
  routerAddress: string;
  fromAddress: string;
  tokenAddress: string;
  amountBaseUnits: bigint;
  depositId: `0x${string}`;
}): DepositWalletCall {
  return {
    target: routerAddress,
    value: "0",
    data: encodeFunctionData({
      abi: BRIDGE_ROUTER_ABI,
      functionName: "depositErc20",
      args: [fromAddress as `0x${string}`, tokenAddress as `0x${string}`, amountBaseUnits, depositId],
    }),
  };
}

function buildWithdrawCalls({
  walletAddress,
  amountBaseUnits,
  strategy,
}: {
  walletAddress: string;
  amountBaseUnits: bigint;
  strategy: WithdrawBatchStrategy;
}): DepositWalletCall[] {
  // if (strategy.kind === "pusd_transfer") {
  //   return [
  //     createErc20TransferCall({
  //       tokenAddress: POLYGON_COLLATERAL_CONTRACTS.pUsd,
  //       recipientAddress: strategy.bridgeRecipient,
  //       amountBaseUnits,
  //     }),
  //   ];
  // }

  const { collateralOfframp, pUsd } = POLYGON_COLLATERAL_CONTRACTS;

  return [
    createErc20ApproveExactCall({
      tokenAddress: pUsd,
      spenderAddress: collateralOfframp,
      amountBaseUnits,
    }),
    createCollateralOfframpUnwrapCall({
      offrampAddress: collateralOfframp,
      assetAddress: strategy.unwrapAsset,
      recipientAddress: walletAddress,
      amountBaseUnits,
    }),
    createErc20ApproveExactCall({
      tokenAddress: strategy.unwrapAsset,
      spenderAddress: strategy.bridgeRouter,
      amountBaseUnits,
    }),
    createBridgeDepositErc20Call({
      routerAddress: strategy.bridgeRouter,
      fromAddress: walletAddress,
      tokenAddress: strategy.unwrapAsset,
      amountBaseUnits,
      depositId: strategy.depositId,
    }),
  ];
}

export function buildWithdrawTransferBatch({
  chainId,
  walletAddress,
  nonce,
  deadline,
  amountBaseUnits,
  strategy,
}: {
  chainId: number;
  walletAddress: string;
  nonce: string;
  deadline: string;
  amountBaseUnits: bigint;
  strategy: WithdrawBatchStrategy;
}): DepositWalletBatchSignablePayload {
  const calls = buildWithdrawCalls({ walletAddress, amountBaseUnits, strategy });

  return buildDepositWalletBatchPayload({
    chainId,
    walletAddress,
    nonce,
    deadline,
    calls,
  });
}

function buildDepositWalletBatchPayload({
  chainId,
  walletAddress,
  nonce,
  deadline,
  calls,
}: {
  chainId: number;
  walletAddress: string;
  nonce: string;
  deadline: string;
  calls: DepositWalletCall[];
}): DepositWalletBatchSignablePayload {
  return {
    domain: {
      name: DEPOSIT_WALLET_DOMAIN_NAME,
      version: DEPOSIT_WALLET_DOMAIN_VERSION,
      chainId,
      verifyingContract: walletAddress as `0x${string}`,
    },
    message: {
      wallet: walletAddress,
      nonce,
      deadline,
      calls,
    },
    primaryType: "Batch",
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      Call: [
        { name: "target", type: "address" },
        { name: "value", type: "uint256" },
        { name: "data", type: "bytes" },
      ],
      Batch: [
        { name: "wallet", type: "address" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
        { name: "calls", type: "Call[]" },
      ],
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
