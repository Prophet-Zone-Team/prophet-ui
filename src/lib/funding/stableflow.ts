import { QuoteRequest, type QuoteResponse, type TokenResponse } from "@stableflow/core";
import Big from "big.js";

import { FUNDING_NETWORKS, FundingNetworkType, type FundingNetwork } from "@/config/funding/networks";
import type { FundingAsset, FundingToken } from "@/config/funding/tokens";
import type { AuthLoginMethod } from "@/store/auth-store";
import {
  getFundingWalletAddress,
  type FundingWalletChainType,
} from "@/store/use-funding-wallet-store";
import {
  getTokensForChain,
  getUniqueChainsFromAssets,
  type SupportedChainOption,
} from "@/lib/funding/supported-assets";
import { getTokenLogo } from "@/utils/logo";
import { getNearAccountSnapshot } from "@/lib/wallet/near/near-account-store";

export const POLYGON_USDC_NATIVE = "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359";

export const STABLEFLOW_BLOCKCHAIN_TO_CHAIN_ID: Record<string, number> = {
  pol: FUNDING_NETWORKS.polygon.chainId,
  arb: FUNDING_NETWORKS.arbitrum.chainId,
  op: FUNDING_NETWORKS.optimism.chainId,
  bsc: FUNDING_NETWORKS.bsc.chainId,
  eth: FUNDING_NETWORKS.ethereum.chainId,
  monad: FUNDING_NETWORKS.monad.chainId,
  base: FUNDING_NETWORKS.base.chainId,
  hypercore: FUNDING_NETWORKS.hyperEvm.chainId,
  abs: FUNDING_NETWORKS.abstract.chainId,
  avax: FUNDING_NETWORKS.avalanche.chainId,
  bera: FUNDING_NETWORKS.berachain.chainId,
  gnosis: FUNDING_NETWORKS.gnosis.chainId,
  plasma: FUNDING_NETWORKS.plasma.chainId,
  scroll: FUNDING_NETWORKS.scroll.chainId,
  xlayer: FUNDING_NETWORKS.xlayer.chainId,
  near: FUNDING_NETWORKS.near.chainId,
  sol: FUNDING_NETWORKS.solana.chainId,
  tron: FUNDING_NETWORKS.tron.chainId,
};

export interface StableflowDepositToken extends FundingAsset {
  assetId: string;
  blockchain: string;
  price: number;
}

export interface StableflowQuoteDisplay {
  estCheckoutTimeMs: number;
  estInputUsd: number;
  estOutputUsd: number;
  estToTokenBaseUnit: string;
  receiveAmountFormatted: string;
}

/** Network cost rate applied to quote amountInUsd (0.01%). */
export const STABLEFLOW_NETWORK_COST_RATE = 0.0001;

export const STABLEFLOW_MAX_SLIPPAGE_PERCENT = 0.5;

export const STABLEFLOW_QR_MIN_DEPOSIT_USD = 1;

export interface StableflowQuoteBreakdownFees {
  networkCostUsd: number;
  priceImpactPercent: number;
}

export function getFundingNetworkForStableflowBlockchain(blockchain: string): FundingNetwork | undefined {
  const chainId = STABLEFLOW_BLOCKCHAIN_TO_CHAIN_ID[blockchain];

  if (!chainId) {
    return undefined;
  }

  return Object.values(FUNDING_NETWORKS).find((network) => network.chainId === chainId);
}

const NATIVE_FUNDING_BLOCKCHAINS = new Set(["near", "sol", "tron"]);

export function filterStableflowTokensForFundingNetworks(tokens: TokenResponse[]): TokenResponse[] {
  return tokens.filter((token) => {
    const network = getFundingNetworkForStableflowBlockchain(token.blockchain);

    if (!network) {
      return false;
    }

    if (/DEPRECATED/i.test(token.symbol)) {
      return false;
    }

    if (network.chainType === FundingNetworkType.EVM) {
      return Boolean(token.contractAddress);
    }

    if (NATIVE_FUNDING_BLOCKCHAINS.has(token.blockchain)) {
      return true;
    }

    return false;
  });
}

export function resolveStableflowTokenAddress(token: TokenResponse): string {
  return token.contractAddress?.trim() || token.assetId;
}

export function isNearOriginStableflowToken(
  token: Pick<StableflowDepositToken, "blockchain">,
): boolean {
  return token.blockchain === "near";
}

export function shouldDepositViaStableflowQr(
  loginMethod: AuthLoginMethod | null | undefined,
  token: Pick<StableflowDepositToken, "blockchain" | "chainType">,
): boolean {
  if (loginMethod === "email" || loginMethod === "google") {
    return true;
  }

  if (loginMethod === "near") {
    return !isNearOriginStableflowToken(token);
  }

  if (
    token.chainType === FundingNetworkType.SVM ||
    token.chainType === FundingNetworkType.TVM ||
    token.chainType === FundingNetworkType.NEAR
  ) {
    return false;
  }

  if (loginMethod === "wallet") {
    return token.chainType !== FundingNetworkType.EVM;
  }

  return false;
}

export function getFundingWalletChainType(
  chainType: FundingNetworkType,
): FundingWalletChainType | undefined {
  switch (chainType) {
    case FundingNetworkType.SVM:
      return "solana";
    case FundingNetworkType.TVM:
      return "tron";
    case FundingNetworkType.EVM:
      return "evm";
    case FundingNetworkType.NEAR:
      return "near";
    default:
      return undefined;
  }
}

export function requiresFundingWalletConnection(
  token: Pick<FundingToken, "chainType">,
): boolean {
  return (
    token.chainType === FundingNetworkType.SVM ||
    token.chainType === FundingNetworkType.TVM ||
    token.chainType === FundingNetworkType.NEAR
  );
}

export function requiresDepositFundingWalletConnection(
  token: Pick<FundingToken, "chainType"> & { blockchain?: string },
  loginMethod: AuthLoginMethod | null | undefined,
): boolean {
  if (
    loginMethod === "near" &&
    token.blockchain &&
    isNearOriginStableflowToken({ blockchain: token.blockchain })
  ) {
    return false;
  }

  return requiresFundingWalletConnection(token);
}

export function resolveFundingWalletAddress(
  token: Pick<FundingToken, "chainType">,
): string | undefined {
  const chainType = getFundingWalletChainType(token.chainType);

  if (!chainType) {
    return undefined;
  }

  return getFundingWalletAddress(chainType);
}

export function isFundingWalletConnected(
  token: Pick<FundingToken, "chainType">,
): boolean {
  if (!requiresFundingWalletConnection(token)) {
    return true;
  }

  return Boolean(resolveFundingWalletAddress(token));
}

export function getStableflowRefundAddress(params: {
  blockchain: string;
  walletAddress?: string;
  nearAccountId?: string | null;
  solanaAddress?: string | null;
  tronAddress?: string | null;
}): string | undefined {
  const { blockchain, walletAddress, nearAccountId, solanaAddress, tronAddress } = params;

  if (blockchain === "near") {
    return nearAccountId ?? getNearAccountSnapshot().accountId ?? undefined;
  }

  if (blockchain === "sol") {
    return solanaAddress ?? getFundingWalletAddress("solana");
  }

  if (blockchain === "tron") {
    return tronAddress ?? getFundingWalletAddress("tron");
  }

  return walletAddress;
}

export function mapStableflowTokenToDepositToken(token: TokenResponse): StableflowDepositToken | undefined {
  const network = getFundingNetworkForStableflowBlockchain(token.blockchain);

  if (!network) {
    return undefined;
  }

  const address = resolveStableflowTokenAddress(token);
  const icon = getTokenLogo(token.symbol);

  return {
    ...network,
    assetId: token.assetId,
    blockchain: token.blockchain,
    symbol: token.symbol,
    name: token.symbol,
    address,
    decimals: token.decimals,
    icon,
    minCheckoutUsd: 0,
    price: token.price,
  };
}

export function resolvePolygonUsdcDestinationAsset(tokens: TokenResponse[]): TokenResponse | undefined {
  return tokens.find(
    (token) =>
      token.blockchain === "pol" &&
      token.symbol === "USDC" &&
      token.contractAddress?.toLowerCase() === POLYGON_USDC_NATIVE,
  );
}

export function isPolygonNativeUsdcToken(token: Pick<StableflowDepositToken, "chainId" | "address">): boolean {
  return token.chainId === FUNDING_NETWORKS.polygon.chainId && token.address.toLowerCase() === POLYGON_USDC_NATIVE;
}

export function buildStableflowQuoteRequest({
  originAssetId,
  destinationAssetId,
  amountBaseUnits,
  refundTo,
  recipient,
  swapType,
}: {
  originAssetId: string;
  destinationAssetId: string;
  amountBaseUnits: string;
  refundTo: string;
  recipient: string;
  swapType?: QuoteRequest.swapType;
}): QuoteRequest {
  return {
    dry: false,
    swapType: swapType ?? QuoteRequest.swapType.EXACT_INPUT,
    slippageTolerance: 50,
    originAsset: originAssetId,
    destinationAsset: destinationAssetId,
    amount: amountBaseUnits,
    refundTo,
    refundType: QuoteRequest.refundType.ORIGIN_CHAIN,
    recipient,
    recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
    depositType: QuoteRequest.depositType.ORIGIN_CHAIN,
    deadline: new Date(Date.now() + 3_600_000).toISOString(),
  };
}

export function mapStableflowQuoteToConfirmDisplay(quote: QuoteResponse): StableflowQuoteDisplay {
  const estCheckoutTimeMs = (quote.quote.timeEstimate ?? 0) * 1000;

  return {
    estCheckoutTimeMs,
    estInputUsd: Number(quote.quote.amountInUsd ?? 0),
    estOutputUsd: Number(quote.quote.amountOutUsd ?? 0),
    estToTokenBaseUnit: quote.quote.amountOut,
    receiveAmountFormatted: quote.quote.amountOutFormatted,
  };
}

export function mapStableflowQuoteToBreakdownFees(
  quote: QuoteResponse,
): StableflowQuoteBreakdownFees {
  const amountInUsd = quote.quote.amountInUsd ?? "0";
  const amountOutUsd = quote.quote.amountOutUsd ?? "0";

  let priceImpact = Big(amountInUsd).minus(amountOutUsd).div(amountInUsd || 1);

  if (priceImpact.lt(0)) {
    priceImpact = Big(0);
  }

  const networkCostUsd = Big(amountInUsd).times(STABLEFLOW_NETWORK_COST_RATE);

  return {
    networkCostUsd: networkCostUsd.toNumber(),
    priceImpactPercent: priceImpact.times(100).toNumber(),
  };
}

export function stableflowTokensToFundingTokens(tokens: StableflowDepositToken[]): FundingAsset[] {
  return tokens.map(({ assetId: _assetId, blockchain: _blockchain, price: _price, ...funding }) => funding);
}

export function getStableflowChainOptions(tokens: StableflowDepositToken[]): SupportedChainOption[] {
  return getUniqueChainsFromAssets(tokens);
}

export function getStableflowTokensForChain(
  tokens: StableflowDepositToken[],
  chainId: number,
): StableflowDepositToken[] {
  return getTokensForChain(tokens, chainId) as StableflowDepositToken[];
}

export function resolveDefaultStableflowQrSelection(
  tokens: StableflowDepositToken[],
): { chain: SupportedChainOption; token: StableflowDepositToken } | undefined {
  if (tokens.length === 0) {
    return undefined;
  }

  const chainOptions = getStableflowChainOptions(tokens);
  const bscChainId = FUNDING_NETWORKS.bsc.chainId;
  const chain = chainOptions.find((option) => option.chainId === bscChainId) ?? chainOptions[0];
  const tokensOnChain = getStableflowTokensForChain(tokens, chain.chainId);
  const token =
    tokensOnChain.find((entry) => entry.symbol === "USDC") ?? tokensOnChain[0];

  if (!token) {
    return undefined;
  }

  return { chain, token };
}

export function sumStableflowChainBalanceUsd(
  tokens: StableflowDepositToken[],
  chainId: number,
  getTokenUsdValue: (
    token: Pick<StableflowDepositToken, "symbol" | "chainId" | "address">,
  ) => number,
): number {
  return getStableflowTokensForChain(tokens, chainId).reduce(
    (total, token) => total + getTokenUsdValue(token),
    0,
  );
}
