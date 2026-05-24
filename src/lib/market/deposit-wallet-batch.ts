import { encodeFunctionData, getAddress, maxUint256 } from "viem";
import type { Hex, TypedDataDomain, TypedDataParameter } from "viem";

import { FundingNetworkType } from "@/config/funding/networks";
import { POLYGON_USDC_NATIVE } from "@/lib/funding/stableflow";
import { POLYGON_COLLATERAL_CONTRACTS } from "@/lib/market/polymarket-collateral-contracts";
import type { BridgeAddressSet } from "@/types/funding";

export const POLYGON_USDC_BRIDGED = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
export const UNISWAP_V3_ROUTER = "0xe592427a0aece92de3edee1f18e0157c05861564";
export const PUSD_WRAP_TARGET = "0x93070a847efEf7F70739046A929D47a521F5B8ee";
export const UNISWAP_FEE_TIER = 100;

const CONVERT_SLIPPAGE_BPS = 50n;

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
const UNISWAP_V3_ROUTER_ABI = [
  {
    name: "exactInputSingle",
    type: "function",
    stateMutability: "payable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "recipient", type: "address" },
          { name: "deadline", type: "uint256" },
          { name: "amountIn", type: "uint256" },
          { name: "amountOutMinimum", type: "uint256" },
          { name: "sqrtPriceLimitX96", type: "uint160" },
        ],
      },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
] as const;
const PUSD_WRAP_ABI = [
  {
    name: "wrap",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
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

export function resolveBridgeWithdrawDepositAddress(
  addresses: BridgeAddressSet,
  chainType: FundingNetworkType = FundingNetworkType.EVM,
): string {
  switch (chainType) {
    case FundingNetworkType.SVM: {
      const svmAddress = addresses.svm?.trim();

      if (!svmAddress) {
        throw new Error("Bridge did not return a Solana withdrawal address.");
      }

      return svmAddress;
    }
    case FundingNetworkType.BTC: {
      const btcAddress = addresses.btc?.trim();

      if (!btcAddress) {
        throw new Error("Bridge did not return a Bitcoin withdrawal address.");
      }

      return btcAddress;
    }
    default: {
      const evmAddress = addresses.evm?.trim();

      if (!evmAddress || !/^0x[a-fA-F0-9]{40}$/.test(evmAddress)) {
        throw new Error("Bridge did not return a valid EVM withdrawal address.");
      }

      return evmAddress;
    }
  }
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

function applySlippageMinimum(amountBaseUnits: bigint, slippageBps = CONVERT_SLIPPAGE_BPS): bigint {
  if (amountBaseUnits <= 0n) {
    return 0n;
  }

  return (amountBaseUnits * (10_000n - slippageBps)) / 10_000n;
}

export function createErc20ApproveCallWithAmount({
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

export function createUniswapExactInputSingleCall({
  tokenIn,
  tokenOut,
  fee,
  recipient,
  amountIn,
  amountOutMinimum,
  deadline,
}: {
  tokenIn: string;
  tokenOut: string;
  fee: number;
  recipient: string;
  amountIn: bigint;
  amountOutMinimum: bigint;
  deadline: bigint;
}): DepositWalletCall {
  return {
    target: UNISWAP_V3_ROUTER,
    value: "0",
    data: encodeFunctionData({
      abi: UNISWAP_V3_ROUTER_ABI,
      functionName: "exactInputSingle",
      args: [
        {
          tokenIn: getAddress(tokenIn),
          tokenOut: getAddress(tokenOut),
          fee,
          recipient: getAddress(recipient),
          deadline,
          amountIn,
          amountOutMinimum,
          sqrtPriceLimitX96: 0n,
        },
      ],
    }),
  };
}

export function createPusdWrapCall({
  usdceAddress,
  amountBaseUnits,
  recipient,
}: {
  usdceAddress: string;
  amountBaseUnits: bigint;
  recipient: string;
}): DepositWalletCall {
  return {
    target: PUSD_WRAP_TARGET,
    value: "0",
    data: encodeFunctionData({
      abi: PUSD_WRAP_ABI,
      functionName: "wrap",
      args: [getAddress(usdceAddress), getAddress(recipient), amountBaseUnits],
    }),
  };
}

export function buildUsdcToUsdceConvertBatch({
  chainId,
  walletAddress,
  nonce,
  deadline,
  amountBaseUnits,
}: {
  chainId: number;
  walletAddress: string;
  nonce: string;
  deadline: string;
  amountBaseUnits: bigint;
}): DepositWalletBatchSignablePayload {
  const swapDeadline = BigInt(Math.floor(Date.now() / 1000) + 900);
  const amountOutMinimum = applySlippageMinimum(amountBaseUnits);

  const calls = [
    createErc20ApproveCall({
      tokenAddress: POLYGON_USDC_NATIVE,
      spenderAddress: UNISWAP_V3_ROUTER,
    }),
    createUniswapExactInputSingleCall({
      tokenIn: POLYGON_USDC_NATIVE,
      tokenOut: POLYGON_USDC_BRIDGED,
      fee: UNISWAP_FEE_TIER,
      recipient: walletAddress,
      amountIn: amountBaseUnits,
      amountOutMinimum,
      deadline: swapDeadline,
    }),
  ];

  return buildDepositWalletBatchPayload({
    chainId,
    walletAddress,
    nonce,
    deadline,
    calls,
  });
}

export function buildUsdceToPusdConvertBatch({
  chainId,
  walletAddress,
  nonce,
  deadline,
  amountBaseUnits,
}: {
  chainId: number;
  walletAddress: string;
  nonce: string;
  deadline: string;
  amountBaseUnits: bigint;
}): DepositWalletBatchSignablePayload {
  const calls = [
    createErc20ApproveCallWithAmount({
      tokenAddress: POLYGON_USDC_BRIDGED,
      spenderAddress: PUSD_WRAP_TARGET,
      amountBaseUnits,
    }),
    createPusdWrapCall({
      usdceAddress: POLYGON_USDC_BRIDGED,
      amountBaseUnits,
      recipient: walletAddress,
    }),
  ];

  return buildDepositWalletBatchPayload({
    chainId,
    walletAddress,
    nonce,
    deadline,
    calls,
  });
}

export function buildWithdrawTransferBatch({
  chainId,
  walletAddress,
  nonce,
  deadline,
  amountBaseUnits,
  bridgeRecipient,
}: {
  chainId: number;
  walletAddress: string;
  nonce: string;
  deadline: string;
  amountBaseUnits: bigint;
  bridgeRecipient: string;
}): DepositWalletBatchSignablePayload {
  const calls = [
    createErc20TransferCall({
      tokenAddress: POLYGON_COLLATERAL_CONTRACTS.pUsd,
      recipientAddress: bridgeRecipient,
      amountBaseUnits,
    }),
  ];

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
