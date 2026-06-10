import { erc20Abi, type Address } from "viem";

import { POLYGON_CHAIN_ID } from "@/lib/market/polymarket-collateral-contracts";
import { getFundingPublicClient } from "@/lib/funding/funding-chain-client";
import { getTradingContractAddresses } from "@/lib/trading/trading-contracts";

export interface OnchainCollateralSnapshot {
  usdcAvailable?: number;
  usdcAllowance?: number;
  allowances?: {
    conditionalTokens?: number;
    exchange?: number;
    negRiskExchange?: number;
    negRiskAdapter?: number;
  };
  contracts?: {
    collateralToken: string;
    conditionalTokens: string;
    exchange: string;
    negRiskExchange: string;
    negRiskAdapter: string;
  };
  updatedAt: string;
  error?: string;
}

export async function isContractDeployedOnPolygon(address: string) {
  const client = getFundingPublicClient(POLYGON_CHAIN_ID);
  const bytecode = await client.getBytecode({
    address: address as Address,
  });

  return Boolean(bytecode && bytecode !== "0x");
}

export async function fetchOnchainCollateralSnapshot(
  funderAddress: string,
): Promise<OnchainCollateralSnapshot> {
  try {
    const contracts = getTradingContractAddresses();
    const client = getFundingPublicClient(POLYGON_CHAIN_ID);
    const owner = funderAddress as Address;
    const collateral = contracts.collateralToken as Address;
    const results = await client.multicall({
      contracts: [
        {
          address: collateral,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [owner],
        },
        {
          address: collateral,
          abi: erc20Abi,
          functionName: "allowance",
          args: [owner, contracts.conditionalTokens as Address],
        },
        {
          address: collateral,
          abi: erc20Abi,
          functionName: "allowance",
          args: [owner, contracts.exchange as Address],
        },
        {
          address: collateral,
          abi: erc20Abi,
          functionName: "allowance",
          args: [owner, contracts.negRiskExchange as Address],
        },
        {
          address: collateral,
          abi: erc20Abi,
          functionName: "allowance",
          args: [owner, contracts.negRiskAdapter as Address],
        },
      ],
      allowFailure: true,
    });
    const [
      balance,
      conditionalTokensAllowance,
      exchangeAllowance,
      negRiskExchangeAllowance,
      negRiskAdapterAllowance,
    ] = results.map(unwrapMulticallBigInt);

    return {
      usdcAvailable: atomicUsdcToNumber(balance),
      usdcAllowance: atomicUsdcToNumber(
        maxBigInt([
          conditionalTokensAllowance,
          exchangeAllowance,
          negRiskExchangeAllowance,
          negRiskAdapterAllowance,
        ]),
      ),
      allowances: {
        conditionalTokens: atomicUsdcToNumber(conditionalTokensAllowance),
        exchange: atomicUsdcToNumber(exchangeAllowance),
        negRiskExchange: atomicUsdcToNumber(negRiskExchangeAllowance),
        negRiskAdapter: atomicUsdcToNumber(negRiskAdapterAllowance),
      },
      contracts,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      updatedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function atomicUsdcToNumber(value: bigint) {
  return Number(value) / 1_000_000;
}

function unwrapMulticallBigInt(
  result: { status: "success"; result: bigint } | { status: "failure"; error: Error },
) {
  if (result.status === "failure") {
    throw result.error;
  }

  return result.result;
}

function maxBigInt(values: bigint[]) {
  return values.reduce((max, value) => (value > max ? value : max), 0n);
}
