import "server-only";

import { createPublicClient, defineChain, erc20Abi, http, type Address } from "viem";

import { getTradingContractAddresses } from "./contracts";

const DEFAULT_POLYGON_RPC_URL = "https://polygon-bor-rpc.publicnode.com";
const polygonChain = defineChain({
  id: 137,
  name: "Polygon",
  nativeCurrency: {
    decimals: 18,
    name: "POL",
    symbol: "POL",
  },
  rpcUrls: {
    default: {
      http: [DEFAULT_POLYGON_RPC_URL],
    },
  },
});

export interface OnchainCollateralSnapshot {
  usdcAvailable?: number;
  usdcAllowance?: number;
  updatedAt: string;
  error?: string;
}

export async function fetchOnchainCollateralSnapshot(funderAddress: string): Promise<OnchainCollateralSnapshot> {
  try {
    const contracts = getTradingContractAddresses();
    const client = createPublicClient({
      chain: polygonChain,
      transport: http(getPolygonRpcUrl()),
    });
    const owner = funderAddress as Address;
    const collateral = contracts.collateralToken as Address;
    const [balance, exchangeAllowance, negRiskExchangeAllowance] = await Promise.all([
      client.readContract({
        address: collateral,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [owner],
      }),
      client.readContract({
        address: collateral,
        abi: erc20Abi,
        functionName: "allowance",
        args: [owner, contracts.exchange as Address],
      }),
      client.readContract({
        address: collateral,
        abi: erc20Abi,
        functionName: "allowance",
        args: [owner, contracts.negRiskExchange as Address],
      }),
    ]);

    return {
      usdcAvailable: atomicUsdcToNumber(balance),
      usdcAllowance: atomicUsdcToNumber(exchangeAllowance > negRiskExchangeAllowance ? exchangeAllowance : negRiskExchangeAllowance),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      updatedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function getPolygonRpcUrl() {
  return (
    process.env.POLYGON_RPC_URL?.trim() ??
    process.env.POLYGON_READ_RPC_URL?.trim() ??
    process.env.NEXT_PUBLIC_POLYGON_RPC_URL?.trim() ??
    DEFAULT_POLYGON_RPC_URL
  );
}

function atomicUsdcToNumber(value: bigint) {
  return Number(value) / 1_000_000;
}
