import { QuoteRequest, type QuoteResponse, type TokenResponse } from "@stableflow/core";
import Big from "big.js";

import { FUNDING_NETWORKS, FundingNetworkType, type FundingNetwork } from "@/config/funding/networks";
import type { FundingAsset } from "@/config/funding/tokens";
import { getTokenLogo } from "@/utils/logo";

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

export function filterStableflowTokensForFundingNetworks(tokens: TokenResponse[]): TokenResponse[] {
  return tokens.filter((token) => {
    if (!token.contractAddress) {
      return false;
    }

    const network = getFundingNetworkForStableflowBlockchain(token.blockchain);

    return Boolean(network && network.chainType === FundingNetworkType.EVM);
  });
}

export function mapStableflowTokenToDepositToken(token: TokenResponse): StableflowDepositToken | undefined {
  const network = getFundingNetworkForStableflowBlockchain(token.blockchain);

  if (!network || !token.contractAddress) {
    return undefined;
  }

  const icon = getTokenLogo(token.symbol);

  return {
    ...network,
    assetId: token.assetId,
    blockchain: token.blockchain,
    symbol: token.symbol,
    name: token.symbol,
    address: token.contractAddress,
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
}: {
  originAssetId: string;
  destinationAssetId: string;
  amountBaseUnits: string;
  refundTo: string;
  recipient: string;
}): QuoteRequest {
  return {
    dry: false,
    swapType: QuoteRequest.swapType.EXACT_INPUT,
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
